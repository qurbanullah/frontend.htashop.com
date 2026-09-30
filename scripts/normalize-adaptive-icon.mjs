// Normalises the adaptive-icon XML that `capacitor-assets` writes.
//
// Run with: npm run assets:generate (this runs as the last step)
//
// The generator writes the same template to both launcher icons with a 16.7% inset
// on *both* layers:
//
//   <background><inset ... inset="16.7%"/></background>
//
// A background inset to the central 72dp of the 108dp adaptive-icon canvas is only
// safe if the launcher's mask crops to that zone. Launchers that reveal more of the
// canvas would show a transparent ring where the background stops. A full-bleed
// background is correct either way (the mask crops it, or it fills the icon), so
// only the foreground keeps the safe-zone inset.

import { readFile, writeFile } from 'node:fs/promises'

const ICON_XML = [
  'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
  'android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml',
]

const EXPECTED = `<background>
        <inset android:drawable="@mipmap/ic_launcher_background" android:inset="16.7%" />
    </background>`

const REPLACEMENT = `<background android:drawable="@mipmap/ic_launcher_background" />`

for (const path of ICON_XML) {
  const xml = await readFile(path, 'utf8')

  if (!xml.includes(EXPECTED)) {
    // Loud on purpose: a generator upgrade that changes the template must be
    // reviewed here rather than silently leaving a masked-out background.
    throw new Error(`${path} does not match the template this script normalises`)
  }

  await writeFile(path, xml.replace(EXPECTED, REPLACEMENT))
  console.log(`normalised ${path}`)
}
