export default function ProtectedRoute({ children }) {
  const user = localStorage.getItem("user");
  //   User validation goes here
  return children;
}
