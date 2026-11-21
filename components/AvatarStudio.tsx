"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  Box,
  Check,
  ChevronDown,
  Compass,
  Image as ImageIcon,
  RotateCw,
  UserRound,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  proportions,
  type Proportion,
  accessoryLabels,
  collections,
  collectionLabels,
  getFaceOptions,
  getOutfitOptions,
  hairColors,
  hairLabels,
  hairStyles,
  resolveLook,
  selectBase,
  selectCollection,
  selectFace,
  selectOutfit,
  skinTones,
  type AvatarData,
} from "./avatar-data";
import styles from "./AvatarStudio.module.css";

const hairColorNames = [
  "Hitam",
  "Cokelat",
  "Pirang madu",
  "Abu-abu",
  "Hitam pekat",
  "Tembaga",
  "Pirang terang",
];
const skinColorNames = [
  "Krem",
  "Keemasan",
  "Sawo matang",
  "Cokelat sedang",
  "Cokelat tua",
  "Persik",
  "Perunggu",
];
const panels = ["Wajah", "Bentuk", "Pakaian", "Detail"] as const;

function Palette({
  title,
  values,
  names,
  value,
  onChange,
}: {
  title: string;
  values: string[];
  names: string[];
  value: string;
  onChange: (color: string) => void;
}) {
  return (
    <fieldset className={styles.palette}>
      <legend>{title}</legend>
      <div>
        {values.map((color, i) => (
          <button
            type="button"
            key={color}
            style={{ backgroundColor: color }}
            aria-label={names[i]}
            title={names[i]}
            aria-pressed={value === color}
            onClick={() => onChange(color)}
          >
            {value === color && (
              <Check size={16} strokeWidth={3} aria-hidden="true" />
            )}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export default function AvatarStudio({
  avatar,
  update,
  supported,
  renderPreview,
  editing,
  remember,
  onRemember,
  onEnter,
}: {
  avatar: AvatarData;
  update: (value: AvatarData) => void;
  supported: boolean | null;
  renderPreview: (rotation: number, portrait: boolean) => ReactNode;
  editing: boolean;
  remember: boolean;
  onRemember: (value: boolean) => void;
  onEnter: () => void;
}) {
  const [panel, setPanel] = useState<(typeof panels)[number]>("Wajah");
  const [view, setView] = useState<"model" | "reference">("model");
  const [rotation, rotate] = useState(0.24);
  const [portrait, zoom] = useState(false);
  const look = resolveLook(avatar);
  const { collection, female } = look;
  const gender = female ? "female" : "male";
  const asset = `/avatars/${collection}/${gender}-`;
  const showingModel = supported && view === "model";
  const faces = getFaceOptions(collection, female);
  const outfits = getOutfitOptions(collection, female);

  function previewChange(value: AvatarData, closer: boolean) {
    update(value);
    setView("model");
    zoom(closer);
  }

  return (
    <div className={`studio ${styles.studio}`}>
      <fieldset className={styles.collections}>
        <legend>Koleksi karakter</legend>
        <div className={styles.collectionList}>
          {collections.map((key) => (
            <button
              type="button"
              key={key}
              className={styles.collection}
              aria-pressed={collection === key}
              onClick={() => {
                if (key !== collection)
                  previewChange(selectCollection(avatar, key), false);
              }}
            >
              <img
                src={`/avatars/${key}/collection.webp`}
                width="140"
                height="71"
                alt=""
              />
              <span>{collectionLabels[key]}</span>
              {key === collection && (
                <Check
                  className={styles.collectionCheck}
                  size={15}
                  strokeWidth={3}
                  aria-hidden="true"
                />
              )}
            </button>
          ))}
        </div>
      </fieldset>

      <div className={styles.desk}>
        <section className={styles.stage} aria-label="Pratinjau karakter">
          <div
            className={styles.viewControls}
            role="group"
            aria-label="Jenis pratinjau"
          >
            <button
              type="button"
              disabled={!supported}
              aria-pressed={!!showingModel}
              onClick={() => setView("model")}
            >
              <Box size={15} />
              Model 3D
            </button>
            <button
              type="button"
              aria-pressed={!showingModel}
              onClick={() => setView("reference")}
            >
              <ImageIcon size={15} />
              Ilustrasi dasar
            </button>
          </div>
          <div className={styles.stageImage}>
            {showingModel ? (
              <div className={`preview ${styles.viewport}`}>
                {renderPreview(rotation, portrait)}
              </div>
            ) : (
              <img
                className={styles.reference}
                src={asset + "hero.webp"}
                alt={`Ilustrasi dasar karakter ${female ? "perempuan" : "laki-laki"} dari koleksi ${collectionLabels[collection]}`}
              />
            )}
          </div>
          <div className={styles.stageFooter}>
            <div>
              <strong>{collectionLabels[collection]}</strong>
              <small>
                {showingModel
                  ? outfits[look.outfitIndex]
                  : "Ilustrasi dari lembar desain"}
              </small>
            </div>
            {showingModel && (
              <div
                className={styles.camera}
                role="group"
                aria-label="Kamera pratinjau"
              >
                <button
                  type="button"
                  onClick={() => zoom((v) => !v)}
                  aria-label={portrait ? "Lihat seluruh tubuh" : "Lihat wajah"}
                  title={portrait ? "Lihat seluruh tubuh" : "Lihat wajah"}
                >
                  {portrait ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
                </button>
                <button
                  type="button"
                  onClick={() => rotate((r) => r + Math.PI / 4)}
                  aria-label="Putar"
                  title="Putar"
                >
                  <RotateCw size={17} />
                </button>
              </div>
            )}
          </div>
        </section>

        <section className={styles.settings} aria-label="Pengaturan avatar">
          <fieldset className={styles.base}>
            <legend>Karakter dasar</legend>
            <div>
              {(["Male", "Female"] as const).map((preset) => (
                <button
                  type="button"
                  key={preset}
                  aria-pressed={avatar.preset === preset}
                  onClick={() => {
                    if (preset !== avatar.preset)
                      previewChange(selectBase(avatar, preset), false);
                  }}
                >
                  {preset === "Male" ? "Laki-laki" : "Perempuan"}
                </button>
              ))}
            </div>
          </fieldset>
          <div
            className={styles.panelButtons}
            role="group"
            aria-label="Pilihan tampilan"
          >
            {panels.map((p) => (
              <button
                type="button"
                key={p}
                aria-pressed={p === panel}
                onClick={() => setPanel(p)}
              >
                {p}
              </button>
            ))}
          </div>
          {panel === "Bentuk" ? (
            <div className={styles.sculpt}>
              {(Object.keys(proportions) as Proportion[]).map((key) => {
                const { label, min, max, base } = proportions[key];
                const value = avatar.shape?.[key] ?? base;
                return (
                  <label key={key}>
                    <span>
                      {label}
                      <output>
                        {value}
                        {key === "height" ? " cm" : "%"}
                      </output>
                    </span>
                    <input
                      type="range"
                      min={min}
                      max={max}
                      value={value}
                      aria-label={label}
                      onChange={(event) =>
                        previewChange(
                          {
                            ...avatar,
                            shape: {
                              ...avatar.shape,
                              [key]: Number(event.target.value),
                            },
                          },
                          key !== "height" && key !== "build",
                        )
                      }
                    />
                  </label>
                );
              })}
              <button
                type="button"
                onClick={() =>
                  previewChange({ ...avatar, shape: undefined }, false)
                }
              >
                Kembalikan proporsi awal
              </button>
            </div>
          ) : panel !== "Detail" ? (
            <fieldset className={styles.choices} key={panel}>
              <legend className={styles.srOnly}>
                {panel === "Wajah" ? "Pilihan wajah" : "Pilihan pakaian"}
              </legend>
              <div className={styles.tiles}>
                {(panel === "Wajah" ? faces : outfits).map((label, index) => {
                  const isFace = panel === "Wajah";
                  const count = isFace ? faces.length : outfits.length - 1;
                  const stripIndex = isFace ? index : index - 1;
                  const selected =
                    index === (isFace ? look.faceIndex : look.outfitIndex);
                  return (
                    <button
                      type="button"
                      className={styles.tile}
                      key={label}
                      aria-pressed={selected}
                      onClick={() =>
                        previewChange(
                          isFace
                            ? selectFace(avatar, index)
                            : selectOutfit(avatar, index),
                          isFace,
                        )
                      }
                    >
                      {stripIndex === -1 ? (
                        <img
                          className={styles.outfitTile}
                          src={asset + "hero.webp"}
                          alt=""
                        />
                      ) : (
                        <span
                          className={
                            isFace ? styles.faceTile : styles.outfitTile
                          }
                          aria-hidden="true"
                          style={{
                            backgroundImage: `url(${asset}${isFace ? "faces" : "outfits"}.webp)`,
                            backgroundSize: `${count * 100}% 100%`,
                            backgroundPosition: `${(100 * stripIndex) / (count - 1)}% 0`,
                          }}
                        />
                      )}
                      <span className={styles.tileLabel}>{label}</span>
                      {selected && (
                        <Check
                          size={14}
                          strokeWidth={3}
                          className={styles.tileCheck}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : (
            <div className={styles.details}>
              <label>
                Gaya rambut
                <select
                  value={look.hair}
                  onChange={(e) =>
                    previewChange({ ...avatar, hair: e.target.value }, true)
                  }
                >
                  {hairStyles.map((h) => (
                    <option key={h} value={h}>
                      {hairLabels[h]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Aksesori
                <select
                  value={look.accessory}
                  onChange={(e) =>
                    previewChange(
                      { ...avatar, accessory: e.target.value },
                      true,
                    )
                  }
                >
                  {Object.entries(accessoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <Palette
                title="Warna rambut"
                values={hairColors}
                names={hairColorNames}
                value={look.hairColor}
                onChange={(hairColor) =>
                  previewChange({ ...avatar, hairColor }, true)
                }
              />
              <Palette
                title="Warna kulit"
                values={skinTones}
                names={skinColorNames}
                value={look.skin}
                onChange={(skin) => previewChange({ ...avatar, skin }, true)}
              />
            </div>
          )}
          <div className={styles.enter}>
            <details className={styles.identity}>
              <summary>
                <UserRound size={16} />{" "}
                {avatar.name || "Nama panggilan (opsional)"}{" "}
                <ChevronDown size={15} />
              </summary>
              <label>
                Nama panggilan
                <input
                  type="text"
                  maxLength={24}
                  value={avatar.name}
                  onChange={(e) => update({ ...avatar, name: e.target.value })}
                />
              </label>
            </details>
            <label className={styles.remember}>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => onRemember(e.target.checked)}
              />
              Simpan avatar saya di perangkat ini
            </label>
            <button
              type="button"
              className={styles.start}
              disabled={supported === null}
              onClick={onEnter}
            >
              <Compass size={17} />
              {supported === false
                ? "Buka direktori kota 2D"
                : editing
                  ? "Lanjutkan menjelajah"
                  : "Masuk ke Central Plaza"}
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
