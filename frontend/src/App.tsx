import { Outlet } from "react-router-dom";

// App acts as a simple layout container. Routes are defined in `src/main.tsx`.
function App() {
  return (
    <div className="min-h-screen">
      <Outlet />
    </div>
  );
}

export default App;
