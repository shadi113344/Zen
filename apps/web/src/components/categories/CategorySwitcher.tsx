import { categoryToSlug } from "@mottazen/core";
import { useNavigate, useParams } from "react-router-dom";
import { SubTabBar } from "@/components/SubTabBar";
import { allCategories } from "@/lib/all-categories";
import { useCategoryColors, useHabits } from "@/hooks/useData";

export function CategorySwitcher() {
  const navigate = useNavigate();
  const { habits } = useHabits();
  const { categoryColors } = useCategoryColors();
  const { slug } = useParams<{ slug?: string }>();
  const categories = allCategories(habits, categoryColors);

  if (categories.length === 0) return null;

  const items = [
    { value: "", label: "All" },
    ...categories.map((cat) => ({ value: categoryToSlug(cat), label: cat })),
  ];

  const active = slug ?? "";

  return (
    <SubTabBar
      className="categories-layout__tabs"
      ariaLabel="Category"
      items={items}
      value={active}
      onChange={(value) => navigate(value ? `/categories/${value}` : "/categories")}
    />
  );
}
