import {useLayoutEffect, useEffect, useState} from 'react'
import {Scoped} from './scoped.component.js'
import {styleTags, incrementCounter, transformCss} from './style-element-utils.js'

export function useCss(css, overrideNamespace) {
  const isPostCss = typeof css === 'object'
  if (isPostCss && !(css.id && typeof css.styles === 'string')) {
    throw Error(`Kremling's "useCss" hook requires "id" and "styles" properties when using the kremling-loader`)
  }
  const namespace = overrideNamespace || (isPostCss && css.namespace) || Scoped.defaultNamespace
  const [styleElement, setStyleElement] = useState(() => getStyleElement(isPostCss, css, namespace, true))
  useStyleElement()

  return {
    [styleElement.kremlingAttr]: String(styleElement.kremlingValue).toString(),
  }

  function useStyleElement() {
    useLayoutEffect(() => {
      const newStyleElement = getStyleElement(isPostCss, css, namespace)
      setStyleElement(newStyleElement)

      return () => {
        if (--styleElement.kremlings === 0) {
          const rawCss = isPostCss ? css.styles : css
          document.head.removeChild(styleElement)
          delete styleTags[rawCss]
        }
      }
    }, [css, namespace, isPostCss])
  }
}

function getStyleElement(isPostCss, css, namespace, incrementKremingsIfFound = false) {
  const kremlingAttr = isPostCss ? namespace : `data-${namespace}`
  const kremlingValue = isPostCss ? css.id : incrementCounter()

  let styleElement = isPostCss ? styleTags[css.styles] : styleTags[css]

  if (styleElement) {
    // This css is already being used by another instance of the component, or another component altogether.
    if (incrementKremingsIfFound) {
      styleElement.kremlings++
    }
  } else {
    const kremlingSelector = `[${kremlingAttr}='${kremlingValue}']`
    const rawCss = isPostCss ? css.styles : css
    const cssToInsert = isPostCss ? css.styles : transformCss(css, kremlingSelector)

    styleElement = document.createElement('style')
    styleElement.type = 'text/css'
    styleElement.textContent = cssToInsert
    styleElement.kremlings = 1
    styleElement.kremlingAttr = kremlingAttr
    styleElement.kremlingValue = kremlingValue
    document.head.appendChild(styleElement)

    styleTags[rawCss] = styleElement
  }

  return styleElement
}
