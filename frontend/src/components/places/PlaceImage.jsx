import { Coffee, Landmark, MapPin, Moon, Mountain, ShoppingBag, Sparkles, TreePine, Utensils, Waves } from "lucide-react";
import { cn } from "cn";
import { CATEGORY_TILE, placeImage } from "@/lib/places";

const CATEGORY_ICON = {
  food: Utensils,
  cafe: Coffee,
  park: TreePine,
  shop: ShoppingBag,
  activity: Sparkles,
  museum: Landmark,
  viewpoint: Mountain,
  beach: Waves,
  nightlife: Moon,
};

/** Place photo, or a colored tile with the category icon if there's no photo. */
export default function PlaceImage({ place, className }) {
  const src = placeImage(place);
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- photos can be remote URLs from the database
      <img
        src={src}
        alt={place.name}
        loading="lazy"
        decoding="async"
        className={cn("shrink-0 rounded-lg object-cover", className)}
      />
    );
  }
  const Icon = CATEGORY_ICON[place?.category] ?? MapPin;
  return (
    <div
      role="img"
      aria-label={place?.name ?? "Place"}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-lg",
        CATEGORY_TILE[place?.category] ?? CATEGORY_TILE.other,
        className
      )}
    >
      <Icon aria-hidden="true" className="size-1/3 min-h-5 min-w-5" />
    </div>
  );
}
