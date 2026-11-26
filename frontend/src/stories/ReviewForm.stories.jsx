import { expect, fn, userEvent, within } from "storybook/test";
import ReviewForm from "@/components/profile/ReviewForm";
import StarRating from "@/components/profile/StarRating";
import { balboa } from "./fixtures";

const meta = {
  title: "Profile/ReviewForm",
  component: ReviewForm,
  args: { place: balboa, onSubmit: fn(async () => {}), onSkip: fn() },
  decorators: [(Story) => <div className="max-w-2xl"><Story /></div>],
};
export default meta;

export const Empty = {};

/** Interaction test: you can't submit without picking stars. */
export const NeedsARating = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Submit Review" }));
    await expect(canvas.getByRole("alert")).toHaveTextContent(/rating/i);
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};

/** Interaction test: fill in and submit. */
export const FilledIn = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("radio", { name: "4 stars" }));
    await userEvent.type(canvas.getByLabelText(/write a short review/i), "Beautiful gardens!");
    await userEvent.click(canvas.getByRole("button", { name: "Submit Review" }));
    await expect(args.onSubmit).toHaveBeenCalledWith({ rating: 4, comment: "Beautiful gardens!" });
  },
};

export const StarsReadOnly = {
  render: () => <StarRating value={4} readOnly />,
};
