const KEY = 'augmentable-ar-views';

export function incrementARView(dishId: string): void {
  try {
    const views = getARViews();
    views[dishId] = (views[dishId] || 0) + 1;
    localStorage.setItem(KEY, JSON.stringify(views));
    window.dispatchEvent(new CustomEvent('ar-view-updated'));
  } catch {}
}

export function getARViews(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function getMostViewedDish<T extends { id: string; arEnabled?: boolean }>(
  menu: T[]
): T | undefined {
  const views = getARViews();
  const arDishes = menu.filter(d => d.arEnabled === true);
  if (!arDishes.length) return undefined;
  const topId = Object.entries(views).sort((a, b) => b[1] - a[1])[0]?.[0];
  const top = arDishes.find(d => d.id === topId);
  return top ?? arDishes[0];
}
