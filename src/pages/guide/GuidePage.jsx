import UserGuideContent from '../../features/help/components/UserGuideContent.jsx'

// Esta pagina actua como frontera entre el router y el contenido de ayuda.
// El feature de documentacion queda libre de dependencias directas del sistema
// de rutas y puede reutilizarse en otro contexto si mas adelante hace falta.
export default function GuidePage() {
  return <UserGuideContent />
}
