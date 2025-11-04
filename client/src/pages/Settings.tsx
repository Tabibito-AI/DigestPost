import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export default function Settings() {
  const { user } = useAuth();
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  // Fetch user configurations
  const configsQuery = trpc.config.list.useQuery();
  const configs = configsQuery.data;
  const isLoading = configsQuery.isLoading;
  const refetch = configsQuery.refetch;

  // Mutations
  const upsertMutation = trpc.config.upsert.useMutation({
    onSuccess: () => {
      showMessage('success', '設定を保存しました');
      refetch();
      setIsAdding(false);
    },
    onError: (error) => {
      showMessage('error', error.message);
    },
  });

  const deleteMutation = trpc.config.delete.useMutation({
    onSuccess: () => {
      showMessage('success', '設定を削除しました');
      refetch();
    },
    onError: (error) => {
      showMessage('error', error.message);
    },
  });

  const toggleMutation = trpc.config.toggleActive.useMutation({
    onSuccess: () => {
      refetch();
    },
    onError: (error) => {
      showMessage('error', error.message);
    },
  });

  const handleAddConfig = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    await upsertMutation.mutateAsync({
      xApiKey: formData.get("xApiKey") as string,
      xApiSecret: formData.get("xApiSecret") as string,
      xAccessToken: formData.get("xAccessToken") as string,
      xAccessTokenSecret: formData.get("xAccessTokenSecret") as string,
      isActive: true,
    });

    form.reset();
  };

  const handleDelete = (configId: number): void => {
    if (confirm("この設定を削除してもよろしいですか？")) {
      deleteMutation.mutate({ id: configId });
    }
  };

  const handleToggle = (configId: number, isActive: boolean): void => {
    toggleMutation.mutate({ id: configId, isActive: !isActive });
  };

  const handleCopyId = (configId: number): void => {
    navigator.clipboard.writeText(configId.toString());
    setCopiedId(configId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>ログインしてください</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Message Display */}
        {message && (
          <div className={`p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {message.text}
          </div>
        )}
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">X (Twitter) 設定</h1>
          <p className="text-muted-foreground mt-2">
            自動ニュース投稿のためのX APIキーを管理してください
          </p>
        </div>

        {/* Add New Configuration */}
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} size="lg">
            <Plus className="w-4 h-4 mr-2" />
            新しい設定を追加
          </Button>
        )}

        {isAdding && (
          <Card>
            <CardHeader>
              <CardTitle>新しい設定を追加</CardTitle>
              <CardDescription>
                X APIの認証情報を入力してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddConfig} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="xApiKey">API Key</Label>
                  <Input
                    id="xApiKey"
                    name="xApiKey"
                    type="password"
                    placeholder="X API Key"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xApiSecret">API Secret</Label>
                  <Input
                    id="xApiSecret"
                    name="xApiSecret"
                    type="password"
                    placeholder="X API Secret"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xAccessToken">Access Token</Label>
                  <Input
                    id="xAccessToken"
                    name="xAccessToken"
                    type="password"
                    placeholder="X Access Token"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="xAccessTokenSecret">Access Token Secret</Label>
                  <Input
                    id="xAccessTokenSecret"
                    name="xAccessTokenSecret"
                    type="password"
                    placeholder="X Access Token Secret"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    type="submit"
                    disabled={upsertMutation.isPending}
                  >
                    {upsertMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    保存
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAdding(false);
                      (document.querySelector('form') as HTMLFormElement)?.reset();
                    }}
                  >
                    キャンセル
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Configurations List */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">登録済みの設定</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : configs && configs.length > 0 ? (
            <div className="space-y-4">
              {configs.map((config) => (
                <Card key={config.id}>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {/* Configuration ID and Status */}
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">設定ID: {config.id}</p>
                          <p className="text-xs text-muted-foreground">
                            作成日時: {new Date(config.createdAt).toLocaleString("ja-JP")}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`toggle-${config.id}`} className="text-sm">
                              {config.isActive ? "有効" : "無効"}
                            </Label>
                            <Switch
                              id={`toggle-${config.id}`}
                              checked={config.isActive}
                              onCheckedChange={() => handleToggle(config.id, config.isActive)}
                            />
                          </div>
                        </div>
                      </div>

                      {/* API Key Display (masked) */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">
                          API Key: {config.xApiKey.substring(0, 4)}...{config.xApiKey.substring(config.xApiKey.length - 4)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyId(config.id)}
                        >
                          {copiedId === config.id ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              コピー済み
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-1" />
                              IDをコピー
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDelete(config.id)}
                          disabled={deleteMutation.isPending}
                        >
                          {deleteMutation.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                          <Trash2 className="w-4 h-4 mr-1" />
                          削除
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  設定がまだ登録されていません。新しい設定を追加してください。
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
