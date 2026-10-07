import { catchAsync } from 'vanta-api';

// Validates req.body by default, or req[source] when a source is given
// (e.g. validate(schema, 'query')).
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const { error } = schema.validate(req[source], { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }
    next();
  };
};
