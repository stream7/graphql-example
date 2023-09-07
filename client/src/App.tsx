import React from "react";

// We use Route in order to define the different routes of our application
import { Route, Routes } from "react-router-dom";

// We import all the components we need in our app
import Navbar from "./components/Navbar";
import TodoList from "./components/TodoList";
import Edit from "./components/Edit";
import Create from "./components/Create";

const App = () => {
  return (
    <div>
      <Navbar />
      <Routes>
        <Route path="/" element={<TodoList />} />
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="/create" element={<Create />} />
      </Routes>
    </div>
  );
};

export default App;
