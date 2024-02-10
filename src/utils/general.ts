export function formatToInternational(numberToFormat: string | number) {
  numberToFormat = Number(Number(numberToFormat).toFixed(2));
  const formattedNumber = new Intl.NumberFormat("en-US").format(numberToFormat);
  return formattedNumber;
}

export function toTitleCase(str: string) {
  return str.replace(/\b\w/g, function (char) {
    return char.toUpperCase();
  });
}

export function getRandomInteger() {
  // Generate a random number between 0 and 1
  const random = Math.random();

  // Scale the random number to fit within the desired range
  const scaled = Math.floor(random * (89 - 70 + 1)) + 70;

  return scaled;
}
