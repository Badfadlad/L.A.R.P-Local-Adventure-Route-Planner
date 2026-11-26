import { expect, fn, userEvent, within } from "storybook/test";
import PlaceCard from "@/components/places/PlaceCard";
import { balboa, coffee, zoo } from "./fixtures";

const meta = {
  title: "Places/PlaceCard",
  component: PlaceCard,
  args: { onAdd: fn(), onToggleBookmark: fn() },
  decorators: [(Story) => <div className="max-w-xl"><Story /></div>],
};
export default meta;

export const FreePlaceWithPhoto = { args: { place: balboa } };
export const PaidPlace = { args: { place: coffee, bookmarked: true } };
export const NoPhoto = { args: { place: zoo } };
export const AlreadyAdded = { args: { place: balboa, added: true } };
export const OnPhone = { args: { place: coffee }, globals: { viewport: { value: "mobile" } } };

/** Interaction test: clicking "Add Stop" calls onAdd with the place. */
export const ClickAddStop = {
  args: { place: balboa },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: /add balboa park as a stop/i }));
    await expect(args.onAdd).toHaveBeenCalledWith(balboa);
  },
};
