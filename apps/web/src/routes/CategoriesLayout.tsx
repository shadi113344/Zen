import { Outlet } from "react-router-dom";

import { ScreenPageBody, ScreenPageTop } from "@/components/ScreenPageTop";

import { CategorySwitcher } from "@/components/categories/CategorySwitcher";



export function CategoriesLayout() {

  return (

    <div className="categories-layout screen-page">

      <ScreenPageTop title="Categories" />

      <ScreenPageBody>

        <CategorySwitcher />

        <Outlet />

      </ScreenPageBody>

    </div>

  );

}

