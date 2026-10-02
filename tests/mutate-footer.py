#!/root/.venvs/mau/bin/python
"""
Prove the two new links tests can fail.

Run from the repo root with the preview already serving:

    ./tests/mutate-footer.py

A test nobody has tried to break is a guess. Each mutation below is a
plausible regression, applied to the working tree, run, and REVERTED - and
the revert is verified, because a half-restored tree makes the next run
lie.
"""
import os
import shutil
import subprocess
import sys
import tempfile

FOOTER = "src/components/Footer.astro"
CONFIG = "src/astro/config.ts"

# (name, file, old, new) - four fields. The first version of this list
# carried a fifth "old text to print" element that the loop never used, so
# the third mutation raised `not enough values to unpack` and the run died
# after reporting two kills it had genuinely made. A harness that crashes
# mid-report takes the evidence down with it.
MUTATIONS = [
    (
        "the footer reverts to emitting separator ELEMENTS",
        FOOTER,
        # Exactly the shape that shipped to production: the dot is its own
        # flex item, so it can be the last thing on a wrapped line.
        'import Footer from \'../astro/Footer.astro\';',
        'import Footer from \'../astro/Footer.astro\';\n<div class="dot">·</div>',
    ),
    (
        "the footer stops rendering the library component",
        FOOTER,
        "import Footer from '../astro/Footer.astro';",
        '<footer class="footer"><div class="footer-meta"><span>© 2026</span></div></footer>',
    ),
    (
        "config.ts regresses to the library placeholder identity",
        CONFIG,
        "title: 'oem/links',",
        "title: 'oem/ui',",
    ),
    (
        "config.ts email diverges from consts.ts",
        CONFIG,
        "email: 'omar@mrxlab.net',",
        "email: 'omar@mrx.sh',",
    ),
]


def run_tests():
    return subprocess.run(
        ["npm", "test"], capture_output=True, text=True, timeout=300
    )


def main():
    if not os.path.exists("src/components/Footer.astro"):
        print("run me from the repo root", file=sys.stderr)
        return 2

    # Baseline first: a mutation that "fails" on an already-red suite
    # proves nothing, and every kill below is meaningless without this.
    base = run_tests()
    if base.returncode != 0:
        print("BASELINE IS RED - fix the suite before measuring anything")
        print(base.stdout[-2000:])
        return 2
    # Read the real count out of node's TAP-ish summary. The first version
    # printed `base.stdout.count('pass 1')`, which counts how many times the
    # substring appears - it reported "0 pass line" on a green suite, which
    # reads as "the tests did not run" and invites exactly the distrust a
    # baseline is meant to prevent.
    summary = ""
    for line in base.stdout.splitlines():
        if line.strip().startswith("# pass"):
            summary = line.strip()
    print(f"baseline: suite green ({summary or 'pass line not found'})\n")

    killed = survived = 0
    for name, path, old, replacement in MUTATIONS:
        full = os.path.join(os.getcwd(), path)
        backup = tempfile.mktemp(suffix=".bak")
        shutil.copy2(full, backup)
        src = open(full).read()
        if old not in src:
            print(f"  NO-OP    {name}\n            pattern not found in {path}")
            survived += 1
            os.unlink(backup)
            continue
        open(full, "w").write(src.replace(old, replacement, 1))
        try:
            r = run_tests()
            out = r.stdout + r.stderr
            if r.returncode != 0:
                killed += 1
                bad = [
                    l.strip()
                    for l in out.splitlines()
                    if l.startswith("not ok") or "AssertionError" in l
                ]
                print(f"  KILLED   {name}")
                if bad:
                    print(f"            {bad[0][:100]}")
            else:
                survived += 1
                print(f"  SURVIVED {name}  <-- the test does not catch this")
        finally:
            shutil.copy2(backup, full)
            os.unlink(backup)

    # The revert must be VERIFIED, not assumed: a mutated file left behind
    # silently becomes the next run's baseline.
    check = run_tests()
    clean = check.returncode == 0
    print(f"\n{killed} killed, {survived} survived, {len(MUTATIONS)} total")
    print("tree restored, suite green" if clean else "RESTORE FAILED - do not trust this run")
    return 0 if survived == 0 and clean else 1


sys.exit(main())