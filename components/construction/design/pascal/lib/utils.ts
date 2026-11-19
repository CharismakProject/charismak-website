// Copied from Pascal Editor (https://github.com/pascalorg/editor, apps/editor), MIT License,
// Copyright (c) 2026 Pascal Group Inc. See third_party/pascal-editor/LICENSE. Import paths adapted.
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
