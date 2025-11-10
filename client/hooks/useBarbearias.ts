import { useEffect, useState } from "react";
import api from "@/lib/api";

export function useBarbearias() {
  const [data, setData] = useState([]);
  useEffect(() => {
    api.get("/barbearias").then((res) => setData(res.data));
  }, []);
  return data;
}
