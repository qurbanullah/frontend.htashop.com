import { Capacitor } from '@capacitor/core'

/** True when running inside the native Android/iOS shell (not a browser). */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform()
}

export function isAndroid(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export function isIOS(): boolean {
  return Capacitor.getPlatform() === 'ios'
}
