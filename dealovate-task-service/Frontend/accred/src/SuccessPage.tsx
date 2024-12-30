import React, { useEffect, useState, useRef } from "react";
import axios from "axios";

interface UserData {
  user_id: string;
  tenant_id: string;
  created_by: string;
  updated_by: string;
  service_id: string;
}

const SuccessPage: React.FC = () => {
  const [status, setStatus] = useState<string | null>(null);
  const calledRef = useRef<boolean>(false);
  
  // Safely parse userData with type checking
  const userData: UserData | null = (() => {
    const storedData = sessionStorage.getItem("userData");
    if (!storedData) return null;
    
    try {
      const parsedData = JSON.parse(storedData);
      // Validate the shape of the parsed data
      if (
        typeof parsedData === "object" &&
        parsedData !== null &&
        "user_id" in parsedData &&
        "tenant_id" in parsedData &&
        "created_by" in parsedData &&
        "updated_by" in parsedData &&
        "service_id" in parsedData
      ) {
        return parsedData as UserData;
      }
      return null;
    } catch (error) {
      console.error("Error parsing userData:", error);
      return null;
    }
  })();

  console.log(userData);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const saveUserData = async (): Promise<void> => {
      if (!userData) {
        setStatus("No user data found.");
        return;
      }

      try {
        await axios.post("http://localhost:4000/api/save-user-data", userData);
        setStatus("User data saved successfully!");
      } catch (err) {
        console.error("Error saving user data:", err);
        setStatus("Failed to save user data.");
      }
    };

    saveUserData();
  }, [userData]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        {status ? (
          <p className="text-xl font-semibold">{status}</p>
        ) : (
          <p className="text-xl font-semibold">Saving your data...</p>
        )}
      </div>
    </div>
  );
};

export default SuccessPage;