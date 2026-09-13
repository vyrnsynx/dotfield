const cjkCharacterPattern = /[\u3400-\u9fff\uf900-\ufaff]/u;

export function hasCjkCharacters(value: string): boolean {
  return cjkCharacterPattern.test(value);
}

export function assertEnglishCopy(value: string, label: string): void {
  if (hasCjkCharacters(value)) {
    throw new Error(
      `${label} must use English. CJK characters are not allowed.`,
    );
  }
}
