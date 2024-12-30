export const checkIfResultIndexIsValid = (
  index: number,
  resultIndex: number,
) => {
  if (isNaN(resultIndex)) {
    throw new Error(
      `Invalid index. Result index '${resultIndex}' is not a number.`,
    );
  }
  if (resultIndex >= index) {
    throw new Error(
      `Invalid index. Result index '${resultIndex}' is greater or equal to the number of commands '${index}' that have been processed.`,
    );
  }
};
