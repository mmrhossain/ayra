export function confirmProductLeave(isSaving: boolean, hasUnsavedChanges: boolean): boolean {
  if (isSaving) return false;
  return !hasUnsavedChanges || window.confirm("Leave this product without saving your changes?");
}
