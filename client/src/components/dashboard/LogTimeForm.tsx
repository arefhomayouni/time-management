import React from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import toast from 'react-hot-toast';
import { useLanguage } from '../../hooks/useLanguage';
import {
  useAddTimeLogMutation,
  useGetMyGroupsQuery,
} from '../../store/api/apiSlice';
import { moneyByRateCurrency, toDateInput } from '../../utils/format';
import DateField from '../common/JalaliDateInput';

const EntrySchema = Yup.object().shape({
  date: Yup.date().typeError('Pick a date').required('Date is required'),
  hours: Yup.number()
    .typeError('Enter a number')
    .min(0.1, 'Minimum 0.1h')
    .max(24, 'A day has 24 hours')
    .required('Hours are required'),
  groupId: Yup.string().nullable(),
});

type LogTimeFormProps = {
  /** Called after a successful save (e.g. close the quick-log sheet). */
  onSaved?: () => void;
  /** Extra classes for the <form> element. */
  className?: string;
};

/**
 * The "log hours" form: date (Jalali or Gregorian aware), hours, and an
 * optional group. Shared by the Dashboard card and the mobile quick-log
 * sheet so both paths behave identically.
 */
const LogTimeForm: React.FC<LogTimeFormProps> = ({ onSaved, className = '' }) => {
  const { t } = useLanguage();
  const { data: groupsData } = useGetMyGroupsQuery();
  const [addTimeLog, { isLoading: adding }] = useAddTimeLogMutation();
  const groups = groupsData?.data || [];

  const handleAdd = async (
    values: { date: string; hours: number | string; groupId: string },
    { setSubmitting, resetForm }: any
  ) => {
    try {
      await addTimeLog({
        date: values.date,
        hours: Number(values.hours),
        groupId: values.groupId || null,
      }).unwrap();
      toast.success(t('dashboard.entry_saved'));
      resetForm();
      onSaved?.();
    } catch (err: any) {
      toast.error(err?.data?.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Formik
      initialValues={{
        date: toDateInput(new Date()),
        hours: '',
        groupId: '',
      }}
      validationSchema={EntrySchema}
      onSubmit={handleAdd}
    >
      {({ isSubmitting }) => (
        <Form className={`space-y-4 ${className}`}>
          <div>
            <Field name="date">
              {({ field, form }: any) => (
                <DateField
                  label={t('common.date')}
                  value={field.value || ''}
                  onChange={(iso) => form.setFieldValue('date', iso)}
                />
              )}
            </Field>
            <ErrorMessage
              name="date"
              component="p"
              className="mt-1.5 text-xs text-accent"
            />
          </div>
          <div>
            <label className="label" htmlFor="entry-hours">
              {t('common.hours')} <span className="text-muted">({t('common.hours_unit')})</span>
            </label>
            <Field
              id="entry-hours"
              type="number"
              step="0.1"
              min="0.1"
              max="24"
              inputMode="decimal"
              name="hours"
              className="field mt-1.5 num"
              placeholder="8"
            />
            <ErrorMessage
              name="hours"
              component="p"
              className="mt-1.5 text-xs text-accent"
            />
          </div>
          <div>
            <label className="label" htmlFor="entry-group">
              {t('dashboard.group')}
            </label>
            <Field as="select" id="entry-group" name="groupId" className="field mt-1.5">
              <option value="">{t('dashboard.group_personal')}</option>
              {groups.map((g: any) => (
                <option key={g._id} value={g._id}>
                  {g.name} · {moneyByRateCurrency(g.hourlyRate, g.hourlyRateCurrency || 'usd')}/
                  {t('common.hr')}
                </option>
              ))}
            </Field>
          </div>
          <button
            type="submit"
            disabled={isSubmitting || adding}
            className="btn-primary w-full py-3"
          >
            {isSubmitting || adding ? t('common.loading') : t('dashboard.save_btn')}
          </button>
        </Form>
      )}
    </Formik>
  );
};

export default LogTimeForm;
