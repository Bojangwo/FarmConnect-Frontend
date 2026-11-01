
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  getFarmerPurchaseRequests,
  respondToPurchaseRequest,
} from "../services/api";

export default function FarmerPurchaseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    async function loadRequests() {
      try {
        const data = await getFarmerPurchaseRequests();
        setRequests(data.requests || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadRequests();
  }, []);

  
async function handleRespond(requestId, status) {
  const action = status === "accepted" ? "accept" : "reject";

  const confirmed = window.confirm(
    `Are you sure you want to ${action} this purchase request?`
  );

  if (!confirmed) return;

  try {
    setError("");
    setProcessingId(requestId);

    const data = await respondToPurchaseRequest(requestId, status);

    // Update the request immediately without refreshing the page
    setRequests((previousRequests) =>
      previousRequests.map((request) =>
        request._id === requestId
          ? { ...request, status: data.request.status }
          : request
      )
    );

    alert(data.message);
  } catch (err) {
    setError(err.message);
  } finally {
    setProcessingId(null);
  }
}


  return (
    <div className="min-h-screen bg-green-50 p-6">
      <div className="mx-auto max-w-5xl">
        <Link
          to="/farmer/dashboard"
          className="mb-6 inline-block text-green-700 hover:underline"
        >
          ← Back to Dashboard
        </Link>

        <h1 className="mb-2 text-3xl font-bold text-green-900">
          Purchase Requests
        </h1>

        <p className="mb-8 text-gray-600">
          Review purchase requests sent by buyers.
        </p>

        {loading && (
          <p className="text-gray-600">Loading requests...</p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow">
            <p className="text-lg text-gray-600">
              No purchase requests yet.
            </p>
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="space-y-5">
            {requests.map((request) => (
              <div
                key={request._id}
                className="rounded-xl bg-white p-6 shadow"
              >
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-semibold text-green-900">
                    {request.product?.name || "Product unavailable"}
                  </h2>

                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium capitalize text-green-800">
                    {request.status}
                  </span>
                </div>

                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Buyer:</strong>{" "}
                    {request.buyer?.name || "Unknown"}
                  </p>

                  <p>
                    <strong>Phone:</strong>{" "}
                    {request.buyer?.phone || "Not available"}
                  </p>

                  <p>
                    <strong>Quantity requested:</strong>{" "}
                    {request.quantityRequested}{" "}
                    {request.product?.unit || ""}
                  </p>

                  <p>
                    <strong>Product price:</strong> D
                    {request.product?.price ?? "N/A"}
                  </p>

                  <p>
                    <strong>Delivery address:</strong>{" "}
                    {request.deliveryAddress || "Not provided"}
                  </p>

                  <p>
                    <strong>Message:</strong>{" "}
                    {request.message || "No message"}
                  </p>
                </div>

                {request.status === "pending" && (
  <div className="mt-5 flex flex-wrap gap-3">
    <button
      type="button"
      onClick={() => handleRespond(request._id, "accepted")}
      disabled={processingId !== null}
      className="rounded-lg bg-green-700 px-5 py-2 font-semibold text-white hover:bg-green-800 disabled:opacity-50"
    >
      {processingId === request._id
        ? "Processing..."
        : "Accept Request"}
    </button>

    <button
      type="button"
      onClick={() => handleRespond(request._id, "rejected")}
      disabled={processingId !== null}
      className="rounded-lg border border-red-500 px-5 py-2 font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
    >
      Reject Request
    </button>
  </div>
)}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
