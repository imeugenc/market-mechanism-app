import { Buffer } from "buffer";

import { supabase } from "@/lib/supabase";

const PAYMENT_PROOF_BUCKET = "payment-proofs";

function normalizeFileExtension(uri: string) {
  const matched = uri.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
  return matched?.[1]?.toLowerCase() ?? "jpg";
}

export async function pickAndUploadPaymentProof(userId: string) {
  let ImagePicker: typeof import("expo-image-picker");

  try {
    ImagePicker = await import("expo-image-picker");
  } catch {
    return {
      success: false,
      message:
        "Modulul nativ pentru selectarea imaginilor nu este disponibil în buildul curent. Rebuild-uiește aplicația iOS după instalarea expo-image-picker.",
    };
  }

  if (
    typeof ImagePicker.requestMediaLibraryPermissionsAsync !== "function" ||
    typeof ImagePicker.launchImageLibraryAsync !== "function"
  ) {
    return {
      success: false,
      message:
        "Buildul nativ curent nu include încă expo-image-picker. Rebuild-uiește iOS development client și redeschide aplicația.",
    };
  }

  let permission;

  try {
    console.log("[paymentProofs] Requesting media library permission");
    permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  } catch {
    return {
      success: false,
      message:
        "Nu am putut porni selectorul de imagini în buildul curent. Rebuild-uiește aplicația iOS și încearcă din nou.",
    };
  }

  if (!permission.granted) {
    return {
      success: false,
      message: "Acordă acces la fotografii pentru a încărca dovada plății.",
    };
  }

  let picked;

  try {
    console.log("[paymentProofs] Launching image picker");
    picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });
  } catch {
    return {
      success: false,
      message:
        "Selectorul de imagini nu este disponibil în buildul curent. Rebuild-uiește iOS development client și încearcă din nou.",
    };
  }

  if (picked.canceled || !picked.assets.length) {
    return {
      success: false,
      message: "Încărcarea a fost anulată.",
    };
  }

  const asset = picked.assets[0];
  const extension = normalizeFileExtension(asset.uri);
  const path = `${userId}/${Date.now()}.${extension}`;

  try {
    console.log("[paymentProofs] Preparing upload payload", {
      uri: asset.uri,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
      path,
    });

    if (!asset.base64) {
      return {
        success: false,
        message: "Imaginea selectată nu a putut fi procesată pentru upload. Încearcă din nou.",
      };
    }

    const fileBuffer = Buffer.from(asset.base64, "base64");

    console.log("[paymentProofs] Uploading to Supabase Storage", {
      bucket: PAYMENT_PROOF_BUCKET,
      path,
      bytes: fileBuffer.byteLength,
    });

    const uploadResult = await supabase.storage.from(PAYMENT_PROOF_BUCKET).upload(path, fileBuffer, {
      contentType: asset.mimeType ?? `image/${extension}`,
      upsert: false,
    });

    if (uploadResult.error) {
      console.error("[paymentProofs] Storage upload failed", uploadResult.error);
      return {
        success: false,
        message: `Upload-ul dovezii a eșuat: ${uploadResult.error.message}`,
      };
    }

    const { data } = supabase.storage.from(PAYMENT_PROOF_BUCKET).getPublicUrl(path);

    console.log("[paymentProofs] Upload complete", {
      path,
      publicUrl: data.publicUrl,
    });

    return {
      success: true,
      message: "Dovada plății a fost încărcată.",
      url: data.publicUrl,
      path,
    };
  } catch (error) {
    console.error("[paymentProofs] Unexpected upload error", error);
    return {
      success: false,
      message:
        error instanceof Error
          ? `Upload-ul dovezii a eșuat: ${error.message}`
          : "Upload-ul dovezii a eșuat dintr-o eroare necunoscută.",
    };
  }
}
