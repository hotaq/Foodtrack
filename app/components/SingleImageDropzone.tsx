'use client';

import * as React from 'react';
import { useDropzone, type DropzoneOptions } from 'react-dropzone';
import { twMerge } from 'tailwind-merge';
import { Upload, X } from 'lucide-react';
import Image from 'next/image';

const variants = {
  base: 'relative rounded-md flex justify-center items-center flex-col cursor-pointer min-h-[150px] min-w-[200px] border border-dashed transition-colors duration-200 ease-in-out',
  image: 'border-0 p-0 min-h-0 min-w-0 relative shadow-md bg-slate-200 rounded-md',
  active: 'border-2',
  disabled: 'bg-gray-200 cursor-default pointer-events-none',
  accept: 'border border-blue-500 bg-blue-50',
  reject: 'border border-red-500 bg-red-50',
};

type InputProps = {
  width?: number;
  height?: number;
  className?: string;
  value?: File | string | null;
  onChange?: (file: File | null) => void | Promise<void>;
  disabled?: boolean;
  dropzoneOptions?: Omit<DropzoneOptions, 'disabled'>;
};

const SingleImageDropzone = React.forwardRef<HTMLDivElement, InputProps>(
  (
    {
      width,
      height,
      value,
      onChange,
      className,
      disabled = false,
      dropzoneOptions,
    },
    ref
  ) => {
    const imageUrl = React.useMemo(() => {
      if (typeof value === 'string') {
        return value;
      } else if (value instanceof File) {
        return URL.createObjectURL(value);
      }
      return null;
    }, [value]);

    const onDrop = React.useCallback<NonNullable<DropzoneOptions['onDrop']>>(
      (acceptedFiles) => {
        if (acceptedFiles && acceptedFiles.length > 0 && !disabled) {
          onChange?.(acceptedFiles[0]);
        }
      },
      [disabled, onChange]
    );

    const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
      useDropzone({
        accept: { 'image/*': [] },
        multiple: false,
        disabled,
        onDrop,
        ...dropzoneOptions,
      });

    const handleRemove = React.useCallback(
      (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        onChange?.(null);
      },
      [onChange]
    );

    return (
      <div
        {...getRootProps({
          className: twMerge(
            variants.base,
            isDragActive && variants.active,
            isDragAccept && variants.accept,
            isDragReject && variants.reject,
            disabled && variants.disabled,
            imageUrl && variants.image,
            className
          ),
          style: {
            width,
            height,
          },
        })}
        ref={ref}
      >
        <input {...getInputProps()} />

        {imageUrl ? (
          <div className="relative w-full h-full">
            <Image
              src={imageUrl}
              alt="Preview"
              fill
              className="object-cover rounded-md"
            />
            {!disabled && (
              <button
                type="button"
                className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <Upload className="h-8 w-8 text-gray-400 mb-2" />
            <div className="text-gray-700 font-medium">Drag & drop an image here</div>
            <div className="text-gray-500 text-sm mt-1">or click to browse</div>
          </div>
        )}
      </div>
    );
  }
);

SingleImageDropzone.displayName = 'SingleImageDropzone';

export { SingleImageDropzone }; 