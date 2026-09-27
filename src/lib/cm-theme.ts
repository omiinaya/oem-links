/**
 * The FOUC guard, as a build-time string.
 *
 * The runtime (oem-ui's cli-mono.js) ships the same snippet for the browser,
 * but an Astro <head> needs it during the build, before any script has run.
 * Both copies are generated from one rule so they cannot disagree: if a saved
 * value is light, set data-theme="light" before the first paint. Nothing else
 * is touched - no storage writes, no other attributes.
 *
 * Legacy keys are searched too, so a visitor who saved their theme under an
 * older key does not get a black flash on their next visit.
 */

export function themeInitSnippet(
	storageKey = 'cm-theme',
	legacyKeys: string[] = [],
): string {
	const keys = [storageKey, ...legacyKeys];
	return (
		'(function(){try{var k=' +
		JSON.stringify(keys) +
		';for(var i=0;i<k.length;i++){var s=localStorage.getItem(k[i]);' +
		'if(s==="light"||s==="dark"){if(s==="light")' +
		'{document.documentElement.setAttribute("data-theme","light");}' +
		'return;}}}catch(e){}})();'
	);
}
