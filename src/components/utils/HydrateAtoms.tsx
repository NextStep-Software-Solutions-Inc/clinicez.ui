"use client";

import type { WritableAtom } from "jotai";
import { useHydrateAtoms } from "jotai/utils";

interface HydrateAtomsProps {
    initialValues: Iterable<readonly [WritableAtom<unknown, [any], unknown>, unknown]>
    children: React.ReactNode;
}
const HydrateAtoms = ({ initialValues, children }: HydrateAtomsProps) => {
  useHydrateAtoms(new Map(initialValues));
  return children;
};

export default HydrateAtoms;