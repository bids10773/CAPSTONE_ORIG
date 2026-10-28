export const bodyParts = [
    { label: 'Head and scalp', field: 'head_scalp' },
    { label: 'Eyes', field: 'eyes' },
    { label: 'Ears', field: 'ears' },
    { label: 'Nose and sinuses', field: 'nose_sinuses' },
    { label: 'Mouth and throat', field: 'mouth_throat' },
    { label: 'Neck and thyroid', field: 'neck_thyroid' },
    { label: 'Chest and breasts', field: 'chest_breast' },
    { label: 'Lungs', field: 'lungs' },
    { label: 'Heart', field: 'heart' },
    { label: 'Abdomen', field: 'abdomen' },
    { label: 'Back and spine', field: 'back' },
    { label: 'Anus and rectum', field: 'anus' },
    { label: 'Genitourinary', field: 'genitals' },
    { label: 'Extremities', field: 'extremities' },
    { label: 'Skin', field: 'skin' },
    { label: 'Dental', field: 'dental' },
];
export const historyFields = [
    ['Present illness', 'present_illness'],
    ['Past medical history', 'past_medical_history'],
    ['Operations or accidents', 'operations_accidents'],
    ['Family history', 'family_history'],
    ['Allergies', 'allergies'],
] as const;
export const allHistoryFields = [
    ...historyFields,
    ['Personal and social history', 'personal_social_history'],
    ['OB / menstrual history', 'ob_menstrual_history'],
] as const;
