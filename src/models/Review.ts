import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReviewDocument extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, createdAt: -1 });

// After save, update product avgRating and reviewCount
ReviewSchema.post("save", async function () {
  const Product = mongoose.model("Product");
  const stats = await mongoose
    .model("Review")
    .aggregate([
      { $match: { product: this.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(this.product, {
      avgRating: Math.round(stats[0].avgRating * 10) / 10,
      reviewCount: stats[0].reviewCount,
    });
  }
});

const Review: Model<IReviewDocument> =
  mongoose.models.Review ||
  mongoose.model<IReviewDocument>("Review", ReviewSchema);

export default Review;
