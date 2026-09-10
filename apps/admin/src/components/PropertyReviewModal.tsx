import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, MapPin, Building, User, IndianRupee, Layers, Sparkles } from 'lucide-react';
import { formatPriceINR } from '@real-estate/shared';

interface PropertyReviewModalProps {
  property: any;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string, makeFeatured?: boolean) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export const PropertyReviewModal: React.FC<PropertyReviewModalProps> = ({
  property,
  isOpen,
  onClose,
  onApprove,
  onReject,
}) => {
  const [rejectMode, setRejectMode] = useState(false);
  const [reason, setReason] = useState('');
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [makeFeatured, setMakeFeatured] = useState<boolean>(false);

  useEffect(() => {
    if (property) {
      setMakeFeatured(Boolean(property.featuredRequested || property.isFeatured));
      setRejectMode(false);
      setReason('');
      setSelectedPhotoIndex(0);
      setError(null);
    }
  }, [property]);

  if (!isOpen || !property) return null;

  const images = property.images && property.images.length > 0
    ? property.images
    : [{ url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800' }];

  const handleApprove = async () => {
    try {
      setIsSubmitting(true);
      setError(null);
      await onApprove(property.id, makeFeatured);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to approve property');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reason || reason.trim().length < 5) {
      setError('Please provide a specific rejection reason (at least 5 characters)');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onReject(property.id, reason);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to reject property');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
              Reviewing: {property.status}
            </span>
            <h2 className="text-lg font-bold text-slate-900 mt-1 line-clamp-1">{property.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
              {error}
            </div>
          )}

          {/* User Featured Request Highlight Banner */}
          {property.featuredRequested && (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/60 border border-amber-200/80 rounded-xl flex items-start space-x-3.5 shadow-sm">
              <div className="p-2 bg-amber-200/70 rounded-lg text-amber-800 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-bold text-amber-950">User Requested "Featured Listing" Spotlight</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-300 text-amber-900 uppercase tracking-wider">
                    REQUESTED
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  The property owner/agent requested this listing to be featured on the Mobile App Home Screen. You can approve it as Featured using the checkbox below.
                </p>
              </div>
            </div>
          )}

          {/* Photo Gallery Viewer */}
          <div className="space-y-3">
            <div className="w-full h-72 rounded-xl overflow-hidden bg-slate-100 relative shadow-inner">
              <img
                src={images[selectedPhotoIndex]?.url || images[0].url}
                alt="Property preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/60 backdrop-blur-md rounded-md text-white text-xs font-medium">
                {selectedPhotoIndex + 1} / {images.length} Photos
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto pb-1">
                {images.map((img: any, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhotoIndex(idx)}
                    className={`w-20 h-14 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                      selectedPhotoIndex === idx ? 'border-blue-600 scale-105' : 'border-transparent opacity-70'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Key Property Specs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
            <div>
              <span className="text-xs text-slate-500 font-medium">Price</span>
              <p className="text-lg font-bold text-slate-900">{formatPriceINR(property.price)}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Category / Type</span>
              <p className="text-sm font-semibold text-slate-800">{property.category} • {property.propertyType}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Built-up Area</span>
              <p className="text-sm font-semibold text-slate-800">{property.area} {property.areaUnit}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 font-medium">Rooms / Floors</span>
              <p className="text-sm font-semibold text-slate-800">
                {property.bedrooms ? `${property.bedrooms} BHK` : 'N/A'} • Floor {property.floorNumber || 0}/{property.totalFloors || 0}
              </p>
            </div>
          </div>

          {/* Location & Owner Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center mb-2">
                <MapPin className="w-4 h-4 mr-1 text-slate-400" /> Location Details
              </h3>
              <p className="text-sm font-medium text-slate-900">{property.address || property.locality}</p>
              <p className="text-xs text-slate-500 mt-0.5">{property.locality}, {property.city}, {property.state} - {property.pincode}</p>
            </div>

            <div className="border border-slate-200 rounded-xl p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center mb-2">
                <User className="w-4 h-4 mr-1 text-slate-400" /> Listing Contact
              </h3>
              <p className="text-sm font-medium text-slate-900">{property.owner?.name || 'Private Owner'}</p>
              <p className="text-xs text-slate-500 mt-0.5">Phone: {property.owner?.phone} • Email: {property.owner?.email}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">Description</h3>
            <p className="text-sm text-slate-700 whitespace-pre-line leading-relaxed bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              {property.description}
            </p>
          </div>

          {/* Amenities & Features */}
          {property.amenities && property.amenities.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center">
                <CheckCircle className="w-4 h-4 mr-1 text-blue-600" /> Amenities & Features ({property.amenities.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {property.amenities.map((item: any, idx: number) => {
                  const name = item.amenity?.name || item.name || 'Amenity';
                  return (
                    <span
                      key={item.id || idx}
                      className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                      {name}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rejection Form Input */}
          {rejectMode && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
              <label className="block text-xs font-bold text-rose-900">
                Reason for Rejection / Changes (Mandatory)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Incomplete address, poor image quality, or price misstated..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => setRejectMode(false)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleReject}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
                >
                  {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {!rejectMode && (
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <button
              onClick={() => setRejectMode(true)}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 border border-rose-200 transition-colors flex items-center"
            >
              <AlertTriangle className="w-4 h-4 mr-1.5" /> Reject Listing
            </button>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 cursor-pointer bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200 px-3 py-1.5 rounded-xl transition-colors">
                <input
                  type="checkbox"
                  checked={makeFeatured}
                  onChange={(e) => setMakeFeatured(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                />
                <span className="text-xs font-bold text-amber-900 flex items-center">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 mr-1" />
                  Approve as Featured
                </span>
              </label>

              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleApprove}
                disabled={isSubmitting}
                className="px-6 py-2 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all flex items-center"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" /> {isSubmitting ? 'Approving...' : makeFeatured ? 'Approve & Feature LIVE' : 'Approve & Publish LIVE'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
