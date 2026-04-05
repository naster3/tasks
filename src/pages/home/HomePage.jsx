import HomeContent from './HomeContent.jsx'

// HomePage representa la ruta principal del sistema.
// Se mantiene fina a proposito: la composicion real del contenido vive
// en HomeContent para separar la preocupacion de ruta y de dominio.
export default function HomePage() {
  return <HomeContent />
}
