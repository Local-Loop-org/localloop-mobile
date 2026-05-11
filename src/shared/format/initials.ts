export function initialsFor(displayName: string): string {
  return (
    displayName
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || '?'
  );
}
