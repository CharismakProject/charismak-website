import type {
  FormworkCalculationInput,
  FormworkCalculationResult,
  FormworkFaceCalculationResult,
} from "./types";

const roundQuantity = (value: number): number =>
  Number(value.toFixed(6));

const assertPositive = (
  name: string,
  value: number
): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }
};

const assertNonNegative = (
  name: string,
  value: number
): void => {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${name} cannot be negative.`);
  }
};

const assertPositiveWholeNumber = (
  name: string,
  value: number
): void => {
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    !Number.isInteger(value)
  ) {
    throw new Error(
      `${name} must be a positive whole number.`
    );
  }
};

export function calculateFormwork(
  input: FormworkCalculationInput
): FormworkCalculationResult {
  assertNonNegative(
    "Formwork wastage",
    input.wastagePercent
  );
  assertPositive(
    "Sheet length",
    input.sheetLengthM
  );
  assertPositive(
    "Sheet width",
    input.sheetWidthM
  );
  assertPositiveWholeNumber(
    "Expected reuse count",
    input.expectedReuseCount
  );

  let faces: FormworkFaceCalculationResult[];
  let directFormworkAreaM2: number | null;
  let basicFormworkAreaM2: number;

  if (input.calculationMode === "individual-faces") {
    if (input.faces.length === 0) {
      throw new Error(
        "At least one formwork face is required."
      );
    }

    faces = input.faces.map((face) => {
      assertPositive(
        `Face "${face.name}" length`,
        face.lengthM
      );
      assertPositive(
        `Face "${face.name}" width`,
        face.widthM
      );
      assertPositiveWholeNumber(
        `Face "${face.name}" quantity`,
        face.quantity
      );

      const contactAreaM2 =
        face.lengthM *
        face.widthM *
        face.quantity;

      return {
        id: face.id,
        name: face.name,
        lengthM: roundQuantity(face.lengthM),
        widthM: roundQuantity(face.widthM),
        quantity: face.quantity,
        contactAreaM2: roundQuantity(
          contactAreaM2
        ),
      };
    });

    basicFormworkAreaM2 = faces.reduce(
      (total, face) =>
        total + face.contactAreaM2,
      0
    );

    directFormworkAreaM2 = null;
  } else {
    assertPositive(
      "Direct formwork area",
      input.directFormworkAreaM2
    );

    faces = [];
    directFormworkAreaM2 =
      input.directFormworkAreaM2;
    basicFormworkAreaM2 =
      input.directFormworkAreaM2;
  }

  const wastageFormworkAreaM2 =
    basicFormworkAreaM2 *
    (input.wastagePercent / 100);

  const finalFormworkAreaM2 =
    basicFormworkAreaM2 +
    wastageFormworkAreaM2;

  const sheetAreaM2 =
    input.sheetLengthM * input.sheetWidthM;

  const effectiveSheetCoverageM2 =
    sheetAreaM2 * input.expectedReuseCount;

  const exactSheetQuantity =
    finalFormworkAreaM2 /
    effectiveSheetCoverageM2;

  const procurementSheetQuantity = Math.ceil(
    exactSheetQuantity
  );

  return {
    id: input.id,
    name: input.name,

    calculationMode: input.calculationMode,
    application: input.application,

    faces,
    directFormworkAreaM2:
      directFormworkAreaM2 === null
        ? null
        : roundQuantity(
            directFormworkAreaM2
          ),

    basicFormworkAreaM2: roundQuantity(
      basicFormworkAreaM2
    ),
    wastageFormworkAreaM2: roundQuantity(
      wastageFormworkAreaM2
    ),
    finalFormworkAreaM2: roundQuantity(
      finalFormworkAreaM2
    ),

    sheetLengthM: roundQuantity(
      input.sheetLengthM
    ),
    sheetWidthM: roundQuantity(
      input.sheetWidthM
    ),
    sheetAreaM2: roundQuantity(sheetAreaM2),
    expectedReuseCount:
      input.expectedReuseCount,
    effectiveSheetCoverageM2: roundQuantity(
      effectiveSheetCoverageM2
    ),

    exactSheetQuantity: roundQuantity(
      exactSheetQuantity
    ),
    procurementSheetQuantity,
  };
}