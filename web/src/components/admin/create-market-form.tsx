"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TransactionButton } from "@/components/shared/transaction-button";
import { useCreateMarket } from "@/hooks/use-admin";
import { MARKET_TYPES, COMPARISON_OPTIONS } from "@/lib/market-types";

export function CreateMarketForm() {
  const [marketTypeId, setMarketTypeId] = useState<string>(MARKET_TYPES[0].id);
  const [param, setParam] = useState("");
  const [description, setDescription] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [operator, setOperator] = useState("0");
  const [bettingDeadline, setBettingDeadline] = useState("");
  const [resolutionDate, setResolutionDate] = useState("");

  const { createMarket, isPending, isConfirming, isSuccess } = useCreateMarket();

  const selectedType = MARKET_TYPES.find((t) => t.id === marketTypeId) ?? MARKET_TYPES[0];

  function handleSubmit() {
    const endpointPath = selectedType.buildEndpointPath(param);
    const jsonPath = selectedType.jsonPath;
    const target = BigInt(targetValue);
    const op = parseInt(operator);
    const deadline = Math.floor(new Date(bettingDeadline).getTime() / 1000);
    const resolution = Math.floor(new Date(resolutionDate).getTime() / 1000);

    createMarket(description, endpointPath, jsonPath, target, op, deadline, resolution);
  }

  const isValid =
    param.length > 0 &&
    description.length > 0 &&
    Number(targetValue) > 0 &&
    bettingDeadline.length > 0 &&
    resolutionDate.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Market</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSuccess && (
          <div className="rounded-lg bg-emerald-500/10 p-3 text-sm text-emerald-400">
            Market created successfully!
          </div>
        )}

        <div className="space-y-2">
          <Label>Market Type</Label>
          <Select value={marketTypeId} onValueChange={setMarketTypeId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MARKET_TYPES.map((type) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{selectedType.paramLabel}</Label>
          <Input
            placeholder={selectedType.paramPlaceholder}
            value={param}
            onChange={(e) => setParam(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Input
            placeholder="Will this target be reached?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{selectedType.targetLabel}</Label>
            <Input
              type="number"
              placeholder={selectedType.targetPlaceholder}
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Comparison</Label>
            <Select value={operator} onValueChange={setOperator}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMPARISON_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Betting Deadline</Label>
            <Input
              type="datetime-local"
              value={bettingDeadline}
              onChange={(e) => setBettingDeadline(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Resolution Date</Label>
            <Input
              type="datetime-local"
              value={resolutionDate}
              onChange={(e) => setResolutionDate(e.target.value)}
            />
          </div>
        </div>

        <TransactionButton
          onClick={handleSubmit}
          isPending={isPending}
          isConfirming={isConfirming}
          disabled={!isValid}
          className="w-full"
        >
          Create Market
        </TransactionButton>
      </CardContent>
    </Card>
  );
}
