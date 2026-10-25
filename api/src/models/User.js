import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    personalRate: {
      type: Number,
      default: 0,
    },
    personalRateCurrency: {
      type: String,
      enum: ["usd", "irr"],
      default: "usd",
    },
    role: {
      type: String,
      enum: ["user", "manager"],
      default: "user",
    },
    /**
     * Bumped on every password change. Access tokens carry the value they
     * were minted with, so incrementing this revokes every older session -
     * a stolen token cannot outlive the password it was issued for.
     */
    tokenVersion: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    /**
     * Password recovery state. `code` stores a SHA-256 hash (never the digits
     * themselves) and `token` the single-use reset JWT, so both are hidden
     * from ordinary reads and neither is useful if the database leaks.
     */
    forgetPasswordToken: {
      time: {
        type: Date,
        default: null,
      },
      token: {
        type: String,
        default: null,
        select: false,
      },
      code: {
        type: String,
        default: null,
        select: false,
      },
      /** Wrong-code attempts for the current code; reset on each new code. */
      attempts: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

/**
 * What a user document looks like on the wire: no password hash, no recovery
 * token, no recovery code, no internal session counter.
 */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  const plain = this.toObject();
  delete plain.password;
  delete plain.forgetPasswordToken;
  delete plain.tokenVersion;
  delete plain.__v;
  return plain;
};

export default mongoose.model("User", userSchema);
