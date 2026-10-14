import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";

import { fetchCategories } from "../../redux/slices/categorySlice";
import Footer from "./Footer";
import Header from "./Header";

function Layout() {
  const dispatch = useDispatch();
  const { items: categories, status } = useSelector((state) => state.categories);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchCategories());
    }
  }, [dispatch, status]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer categories={categories} />
    </div>
  );
}

export default Layout;
