import {ReactNode, useEffect, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {CircleX, ImageIcon, Loader2} from "lucide-react";
import {Dialog, DialogContent, DialogTitle} from "@/components/ui/dialog.tsx";
import {WithUUID} from "@/lib/crud.ts";

interface ImageFetcherProps {
  fetcher: () => Promise<string>;
  alt: string;
}

export function OpenImageModal({fetcher, alt}: Readonly<ImageFetcherProps>) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageSrc && open) {
      setLoading(true);
      setError(null); // Reinicia errores previos
      setImageSrc(null); // Limpia la imagen previa

      fetcher()
        .then(setImageSrc)
        .catch((e) => {
          console.error(e);
          setError(e.message);
        })
        .finally(() => setLoading(false));
    }
  }, [open, fetcher, imageSrc]);


  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <ImageIcon/>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-h-[80vh] overflow-hidden">
          <DialogTitle>{alt}</DialogTitle>
          <div className="relative flex justify-center items-center w-full max-h-[calc(80vh-8rem)]">
            {loading && <Loader2 className="animate-spin"/>}
            {error && <CircleX className="text-red-500"/>}
            {imageSrc && (
              <img
                src={imageSrc}
                alt={alt}
                className="w-full h-full object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function LoadingImage({fetcher, alt}: Readonly<ImageFetcherProps>) {
  const [loading, setLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!imageSrc) {
      setLoading(true);
      setError(null); // Reinicia errores previos
      setImageSrc(null); // Limpia la imagen previa

      fetcher()
        .then(setImageSrc)
        .catch((e) => {
          console.error(e);
          setError(e.message);
        })
        .finally(() => setLoading(false));
    }
  }, [fetcher, imageSrc]);

  return (
    <div className="flex justify-center">
      {loading && <Loader2 className="animate-spin"/>}
      {error && <CircleX className="text-red-500"/>}
      {imageSrc && <img src={imageSrc} alt={alt} className="w-full"/>}
    </div>
  );
}

export function ClickToShowUUID({id}: Readonly<WithUUID>) {
  const [show, setShow] = useState(false);

  return (
    <button onClick={() => setShow(!show)} className="cursor-pointer">
      {show ? id : id.substring(0, 10)}
    </button>
  )
}

export interface ItemsOnRoundedProps<T> {
  items: T[]
  mapper?: (item: T) => ReactNode
  max?: number
}

export function ItemsOnRounded<T extends ReactNode>({items, mapper, max}: Readonly<ItemsOnRoundedProps<T>>) {
  return <>
    {items.slice(0, max).map((tag) => {
      return (
        <span key={tag + ""} className="inline-block text-xs font-semibold py-1 px-2 rounded-full border m-1">
        {mapper ? mapper(tag) : tag}
      </span>
      )
    })}
  </>
}

export interface TruncateProps {
  text: string
  length?: number
}

const defaultLength = 50;

export function Truncate({text, length = defaultLength}: Readonly<TruncateProps>) {
  return text.length > length ? text.substring(0, length) + "..." : text;
}