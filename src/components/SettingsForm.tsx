"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { useAuditStore } from "@/store/auditStore";
import {
  FieldLabel,
  Panel,
  PanelBody,
  PanelHeader,
  SegmentedControl,
  StatusNotice,
  SwitchRow,
} from "@/components/ui";

export function SettingsForm() {
  const { language, setLanguage, debugMode, setDebugMode, hydrate } =
    useAuditStore(
      useShallow((s) => ({
        language: s.language,
        setLanguage: s.setLanguage,
        debugMode: s.debugMode,
        setDebugMode: s.setDebugMode,
        hydrate: s.hydrate,
      }))
    );

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  return (
    <section className="space-y-6">
      <Panel>
        <PanelHeader
          title="Отчёт и диагностика"
          description="Язык результата и подробность технического журнала во время проверки."
        />

        <PanelBody className="space-y-5">
          <div className="space-y-2">
            <FieldLabel>Язык отчёта</FieldLabel>
            <SegmentedControl
              ariaLabel="Язык отчёта"
              value={language}
              onChange={setLanguage}
              options={[
                { value: "ru", label: "Русский" },
                { value: "en", label: "English" },
              ]}
            />
          </div>

          <SwitchRow
            label="Расширенные логи"
            description="Показывать в журнале отладочные события и подробности по каждому вызову инструмента."
            checked={debugMode}
            onChange={setDebugMode}
          />
        </PanelBody>
      </Panel>

      <StatusNotice tone="info" heading="Автосохранение">
        Язык отчёта и URL сохраняются локально. История аудитов остаётся в
        браузере.
      </StatusNotice>
    </section>
  );
}
