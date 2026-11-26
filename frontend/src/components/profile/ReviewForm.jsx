"use client";

import { useState } from "react";
import { CircleCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { placeSubtitle } from "@/lib/places";
import { sanitizeText, validateReview } from "@/lib/validation";
import StarRating from "./StarRating";

/**
 * "Review Your Visit" card. Calls onSubmit({ rating, comment }) and onSkip().
 * onSubmit may throw an Error; its message is shown to the user.
 */
export default function ReviewForm({ place, onSubmit, onSkip }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const clean = sanitizeText(comment, 2000);
    const problem = validateReview({ rating, comment: clean });
    if (problem) {
      setError(problem);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await onSubmit({ rating, comment: clean || null });
      setRating(0);
      setComment("");
    } catch (err) {
      setError(err?.message || "Could not save your review.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-label={`Review ${place.name}`}
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7"
    >
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <h3 className="font-heading text-xl font-semibold">{place.name}</h3>
          <p className="text-sm text-muted-foreground">{placeSubtitle(place)}</p>
        </div>
        <Badge variant="soft">
          <CircleCheck aria-hidden="true" />
          Visit completed
        </Badge>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-sm font-semibold">How was it?</legend>
        <StarRating value={rating} onChange={setRating} label={`Rating for ${place.name}`} />
      </fieldset>

      <div className="flex flex-col gap-2">
        <Label htmlFor={`review-${place.id}`} className="font-semibold">
          Write a short review
        </Label>
        <Textarea
          id={`review-${place.id}`}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={2000}
          placeholder="Share your experience..."
          className="min-h-28 bg-muted/40"
        />
        <p className="self-end text-xs text-muted-foreground">{comment.length}/2000</p>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="h-11 text-base" disabled={submitting}>
          {submitting ? "Submitting..." : "Submit Review"}
        </Button>
        {onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip}>
            Skip for now
          </Button>
        )}
      </div>
    </form>
  );
}
