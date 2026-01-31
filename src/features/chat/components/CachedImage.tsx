import React, { useState, useEffect } from "react";
import { Image as ImageIcon } from "lucide-react";

interface CachedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src: string;
}

export const CachedImage: React.FC<CachedImageProps> = ({ src, alt, className, ...props }) => {
    const [blobUrl, setBlobUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let active = true;

        const load = async () => {
            if (!src) return;
            setIsLoading(true);
            setError(false);

            try {
                const cacheName = 'chat-media-v1';
                const cache = await caches.open(cacheName);
                const match = await cache.match(src);

                if (match) {
                    const blob = await match.blob();
                    const url = URL.createObjectURL(blob);
                    if (active) {
                        setBlobUrl(url);
                        setIsLoading(false);
                    }
                } else {
                    // Fetch and cache
                    try {
                        // Use fetch to get blob
                        const response = await fetch(src);
                        if (!response.ok) throw new Error('Network response was not ok');

                        // Clone response to put in cache
                        const clonedResponse = response.clone();
                        await cache.put(src, clonedResponse);

                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);

                        if (active) {
                            setBlobUrl(url);
                            setIsLoading(false);
                        }
                    } catch (e) {
                        console.warn("Failed to cache image, falling back to network url:", e);
                        if (active) {
                            // Determine if we should fallback to src or error?
                            // If fetch failed, src might also fail in img tag, but let's try.
                            // Or maybe just show error.
                            // Actually, if fetch failed, it might be auth or network.
                            // Let's fallback to original src which lets browser handle it.
                            setBlobUrl(src);
                            setIsLoading(false);
                        }
                    }
                }
            } catch (err) {
                console.error("Cache API error:", err);
                // Fallback
                if (active) {
                    setBlobUrl(src);
                    setIsLoading(false);
                }
            }
        };

        load();

        return () => {
            active = false;
            if (blobUrl && blobUrl.startsWith('blob:')) {
                URL.revokeObjectURL(blobUrl);
            }
        };
    }, [src]);

    if (isLoading) {
        return (
            <div className={`flex items-center justify-center bg-gray-100 dark:bg-zinc-800 animate-pulse ${className}`} style={{ minHeight: '100px', minWidth: '100px' }}>
                <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
        );
    }

    return (
        <img
            src={blobUrl || src}
            alt={alt}
            className={className}
            {...props}
            onError={() => setError(true)}
        />
    );
};
