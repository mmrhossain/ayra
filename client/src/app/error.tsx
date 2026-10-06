"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
            <h2 className="text-2xl font-bold text-red-600">Something went wrong!</h2>

            {/* REMOVE error.message */}
            <p className="text-red-500 mt-2">
                Please try again later.
            </p>

            <button
                onClick={() => reset()}
                className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-btn-hover"
            >
                Retry
            </button>
        </div>
    );
}
