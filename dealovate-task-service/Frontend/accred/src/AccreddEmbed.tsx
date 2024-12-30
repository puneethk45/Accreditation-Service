import React, { useState } from "react";
import axios from "axios";

interface BaseUserData {
  user_id: string;
  tenant_id: string;
  created_by: string;
  updated_by: string;
}

interface UserData extends BaseUserData {
  service_id: string;
}

interface EmbedLinkResponse {
 
    embedLinkData: string;
    transactionId: string;

}

const AccreddEmbed: React.FC = () => {
  const [iframeLink, setIframeLink] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [externalUniqueID, setExternalUniqueID] = useState<string>("");
  const [showIframe, setShowIframe] = useState<boolean>(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  const fetchEmbedLink = async (): Promise<void> => {
    setLoading(true);

    const baseUserData: BaseUserData = {
      user_id: "550e8400-e29b-41d4-a716-446655440045",
      tenant_id: "550e8400-e29b-41d4-a716-446655440034",
      created_by: "System",
      updated_by: "System",
    };

    try {
      const response = await axios.post<EmbedLinkResponse>(
        "http://localhost:4000/api/embed-ui-link",
        baseUserData
      );
      console.log(response.data)
      setIframeLink(response.data.embedLinkData);
      const updatedUserData: UserData = {
        ...baseUserData,
        service_id: response.data.transactionId,
      };

      setUserData(updatedUserData);
      console.log(updatedUserData)
      setExternalUniqueID(response.data.transactionId);

      sessionStorage.setItem("userData", JSON.stringify(updatedUserData));

      setShowIframe(true);
    } catch (err) {
      console.error(
        "Failed to fetch the iframe link:",
        err instanceof Error ? err.message : "Unknown error"
      );
      alert("Failed to load the Accredd UI. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-100">
      <div className="h-screen w-full flex flex-col">
        <h1 className="text-2xl font-bold text-gray-800 text-center p-4 bg-white shadow-md">
          Accredd Verification
        </h1>

        {!showIframe ? (
          <div className="flex items-center justify-center flex-grow p-4">
            <button
              onClick={fetchEmbedLink}
              disabled={loading}
              className={`w-full max-w-md py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
            >
              {loading ? "Loading..." : "Open Accredd UI"}
            </button>
          </div>
        ) : (
          <div className="relative flex-grow">
            <iframe
              src={iframeLink}
              title="Accredd Embedded UI"
              className="absolute inset-0 w-full h-full border-none"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AccreddEmbed;