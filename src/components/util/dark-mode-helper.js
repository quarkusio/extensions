function prefersDarkMode() {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
}

const localStorageKey = "color-theme"
const light = "light"
const dark = "dark"
const system = "system"

export function getDisplayModeFromLocalStorageNoDefault() {
  if (typeof localStorage !== `undefined`) {
    return localStorage.getItem(localStorageKey)
  }
}

export const getDisplayModeFromLocalStorage = () => {
  return getDisplayModeFromLocalStorageNoDefault() || light
}

function adjustCssClasses(storedTheme) {
  if (typeof document !== `undefined`) {
    if (storedTheme === dark || (storedTheme === system && prefersDarkMode())) {
      document.documentElement.classList.add(dark)
    } else {
      document.documentElement.classList.remove(dark)
    }
  }
}

export const initialiseDisplayModeFromLocalStorage = () => {
  const theme = getDisplayModeFromLocalStorage()
  adjustCssClasses(theme)
}

export const setDisplayMode = (newTheme) => {
  if (typeof localStorage !== `undefined`) {
    localStorage.setItem(localStorageKey, newTheme)
    adjustCssClasses(newTheme)
    const themeMetadata = document.querySelector("meta[name=\"theme-color\"]")
    if (themeMetadata) themeMetadata.content = newTheme
  }
}