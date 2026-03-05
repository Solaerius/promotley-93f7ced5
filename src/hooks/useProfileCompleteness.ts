import { useState, useCallback } from "react";
import { useAIProfile } from "./useAIProfile";

const REQUIRED_FIELDS = [
  { key: "foretagsnamn", label: "Företagsnamn" },
  { key: "branch", label: "Bransch" },
  { key: "stad", label: "Stad" },
  { key: "postnummer", label: "Postnummer" },
  { key: "malgrupp", label: "Målgrupp" },
  { key: "produkt_beskrivning", label: "Företagsbeskrivning" },
] as const;

export const useProfileCompleteness = () => {
  const { profile, loading } = useAIProfile();
  const [showModal, setShowModal] = useState(false);

  const getMissingFields = useCallback(() => {
    if (!profile) return REQUIRED_FIELDS.map((f) => f.label);
    return REQUIRED_FIELDS.filter(
      (f) =>
        !profile[f.key as keyof typeof profile] ||
        String(profile[f.key as keyof typeof profile]).trim() === ""
    ).map((f) => f.label);
  }, [profile]);

  const isComplete = useCallback(() => {
    return getMissingFields().length === 0;
  }, [getMissingFields]);

  /** Call before any AI action. Returns true if profile is complete. Shows modal if not. */
  const requireComplete = useCallback(() => {
    if (isComplete()) return true;
    setShowModal(true);
    return false;
  }, [isComplete]);

  return {
    isProfileComplete: isComplete(),
    missingFields: getMissingFields(),
    showModal,
    setShowModal,
    requireComplete,
    loading,
  };
};
