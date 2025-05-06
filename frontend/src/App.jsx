import { Route, Routes } from "react-router-dom";
import Login from "./pages/login";

export const Home = () => {
  return <div>Home</div>;
};

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />}></Route>
    </Routes>
  );
}

export default App;
