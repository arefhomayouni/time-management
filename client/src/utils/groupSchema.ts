import * as Yup from 'yup';

/**
 * Validation shared by the create-group page and the group settings form.
 * Rial rates are quoted in the millions, so only USD gets the 100k ceiling;
 * the Rial ceiling exists purely to catch someone pasting a wrong number.
 */
export const groupSchema = Yup.object().shape({
  name: Yup.string().trim().min(2, 'At least 2 characters').required('Name is required'),
  hourlyRate: Yup.number()
    .typeError('Enter a number')
    .min(0, 'Cannot be negative')
    .when('hourlyRateCurrency', {
      is: 'irr',
      then: (s) => s.max(1_000_000_000_000, 'That looks too high'),
      otherwise: (s) => s.max(100000, 'That looks too high'),
    })
    .required('Rate is required'),
  hourlyRateCurrency: Yup.string().oneOf(['usd', 'irr']).required('Required'),
  budget: Yup.number()
    .transform((value, original) => (original === '' || original === null ? undefined : value))
    .typeError('Enter a number')
    .min(0, 'Cannot be negative'),
});
