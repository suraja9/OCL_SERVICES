import mongoose from "mongoose";

// Route-based pricing schema (Assam → NE, Assam → ROI)
const routeRateSchema = new mongoose.Schema({
  assamToNe: { type: Number, default: 0, min: [0, "Price cannot be negative"] },
  assamToRoi: { type: Number, default: 0, min: [0, "Price cannot be negative"] }
}, { _id: false });

// Standard DOX weight slabs schema
const standardDoxWeightSlabSchema = new mongoose.Schema({
  "01gm-250gm": { type: routeRateSchema, default: () => ({}) },
  "251gm-500gm": { type: routeRateSchema, default: () => ({}) },
  add500gm: { type: routeRateSchema, default: () => ({}) }
}, { _id: false });

// Standard DOX modes schema (Air, Road, Train)
const standardDoxModesSchema = new mongoose.Schema({
  air: { type: standardDoxWeightSlabSchema, default: () => ({}) },
  road: { type: standardDoxWeightSlabSchema, default: () => ({}) },
  train: { type: routeRateSchema, default: () => ({}) } // Train uses per-kg only
}, { _id: false });

// Standard NON DOX weight slabs schema
const standardNonDoxWeightSlabSchema = new mongoose.Schema({
  "1kg-5kg": { type: routeRateSchema, default: () => ({}) }, // Per kg
  "5kg-100kg": { type: routeRateSchema, default: () => ({}) } // Per kg
}, { _id: false });

// Standard NON DOX modes schema (Air, Road, Train)
const standardNonDoxModesSchema = new mongoose.Schema({
  air: { type: standardNonDoxWeightSlabSchema, default: () => ({}) },
  road: { type: standardNonDoxWeightSlabSchema, default: () => ({}) },
  train: { type: routeRateSchema, default: () => ({}) } // Train uses per-kg only
}, { _id: false });

// Priority unified pricing schema (no modes, no DOX/NON DOX separation, single price per 500gm)
const priorityPricingSchema = new mongoose.Schema({
  base500gm: { type: Number, default: 0, min: [0, "Price cannot be negative"] }
}, { _id: false });

const reverseDeliverySchema = new mongoose.Schema({
  normal: { type: Number, default: 0, min: [0, "Price cannot be negative"] },
  priority: { type: Number, default: 0, min: [0, "Price cannot be negative"] }
}, { _id: false });

const reverseTransportSchema = new mongoose.Schema({
  byRoad: { type: reverseDeliverySchema, default: () => ({}) },
  byTrain: { type: reverseDeliverySchema, default: () => ({}) },
  byFlight: { type: reverseDeliverySchema, default: () => ({}) }
}, { _id: false });

const reversePricingSchema = new mongoose.Schema({
  toAssam: { type: reverseTransportSchema, default: () => ({}) },
  toNorthEast: { type: reverseTransportSchema, default: () => ({}) }
}, { _id: false });

const customerPricingSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    unique: true,
    default: "default"
  },
  standardDox: {
    type: standardDoxModesSchema,
    default: () => ({})
  },
  standardNonDox: {
    type: standardNonDoxModesSchema,
    default: () => ({})
  },
  priorityPricing: {
    type: priorityPricingSchema,
    default: () => ({})
  },
  reversePricing: {
    type: reversePricingSchema,
    default: () => ({})
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, "Notes cannot be longer than 1000 characters"]
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    default: null
  },
  lastUpdatedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: "customerpricing"
});

// slug already has an index (unique: true)
customerPricingSchema.index({ updatedAt: -1 });

customerPricingSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  }
});

customerPricingSchema.pre("save", function(next) {
  if (this.isModified()) {
    this.lastUpdatedAt = new Date();
  }
  next();
});

customerPricingSchema.statics.getSingleton = async function() {
  let pricing = await this.findOne({ slug: "default" })
    .populate("lastUpdatedBy", "name email")
    .lean();

  if (!pricing) {
    pricing = await this.create({ slug: "default" });
    pricing = await this.findOne({ slug: "default" })
      .populate("lastUpdatedBy", "name email")
      .lean();
  }

  return pricing;
};

export default mongoose.model("CustomerPricing", customerPricingSchema);

