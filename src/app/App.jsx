import { Outlet } from 'react-router-dom';
import Header from '../shared/components/Header';

const App = () => {
  return (
    <>
      <Header />
      <Outlet />
    </>
  );
};

export default App;
