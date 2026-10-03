"use client";
import { Button } from "@/components/ui/button";
import { useForm, FormProvider, useFormState } from "react-hook-form";
import { useAuthPatchMeService } from "@/services/api/services/auth";
import useAuthActions from "@/services/auth/use-auth-actions";
import FormTextInput from "@/components/form/text-input/form-text-input";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import withPageRequiredAuth from "@/services/auth/with-page-required-auth";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TabsWorkspace } from "@wasnaker/core-web";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import useAuth from "@/services/auth/use-auth";
import { useSnackbar } from "@/hooks/use-snackbar";
import FormAvatarInput from "@/components/form/avatar-input/form-avatar-input";
import { FileEntity } from "@/services/api/types/file-entity";
import useLeavePage from "@/services/leave-page/use-leave-page";
import HTTP_CODES_ENUM from "@/services/api/types/http-codes";
import { useTranslation } from "@/services/i18n/client";
import { UserProviderEnum } from "@/services/api/types/user";
import {
  ProfileTab,
  useGetProfileTabsService,
} from "@/services/api/services/profile";
import { getProfileTabPanel } from "@/services/profile/profile-tab-panel.registry";
import "@/modules/profile-tab-contributions";

const profileTabsQueryKey = ["profile", "tabs"];

type EditProfileBasicInfoFormData = {
  firstName: string;
  lastName: string;
  photo?: FileEntity;
};

type EditProfileChangePasswordFormData = {
  oldPassword: string;
  password: string;
  passwordConfirmation: string;
};

type EditProfileChangeEmailFormData = {
  email: string;
  emailConfirmation: string;
};

const useValidationBasicInfoSchema = () => {
  const { t } = useTranslation("profile");

  return yup.object().shape({
    firstName: yup
      .string()
      .required(t("profile:inputs.firstName.validation.required")),
    lastName: yup
      .string()
      .required(t("profile:inputs.lastName.validation.required")),
  });
};

const useValidationChangeEmailSchema = () => {
  const { t } = useTranslation("profile");
  const { user } = useAuth();

  return yup.object().shape({
    email: yup
      .string()
      .notOneOf(
        [user?.email],
        t("profile:inputs.email.validation.currentEmail")
      )
      .email(t("profile:inputs.email.validation.email"))
      .required(t("profile:inputs.email.validation.required")),
    emailConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("email")],
        t("profile:inputs.emailConfirmation.validation.match")
      )
      .required(t("profile:inputs.emailConfirmation.validation.required")),
  });
};

const useValidationChangePasswordSchema = () => {
  const { t } = useTranslation("profile");

  return yup.object().shape({
    oldPassword: yup
      .string()
      .min(6, t("profile:inputs.password.validation.min"))
      .required(t("profile:inputs.password.validation.required")),
    password: yup
      .string()
      .min(6, t("profile:inputs.password.validation.min"))
      .required(t("profile:inputs.password.validation.required")),
    passwordConfirmation: yup
      .string()
      .oneOf(
        [yup.ref("password")],
        t("profile:inputs.passwordConfirmation.validation.match")
      )
      .required(t("profile:inputs.passwordConfirmation.validation.required")),
  });
};

function BasicInfoFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-profile">
      {t("profile:actions.submit")}
    </Button>
  );
}

function ChangeEmailFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-email">
      {t("profile:actions.submit")}
    </Button>
  );
}

function ChangePasswordFormActions() {
  const { t } = useTranslation("profile");
  const { isSubmitting, isDirty } = useFormState();
  useLeavePage(isDirty);

  return (
    <Button type="submit" disabled={isSubmitting} data-testid="save-password">
      {t("profile:actions.submit")}
    </Button>
  );
}

function FormBasicInfo() {
  const { setUser } = useAuthActions();
  const { user } = useAuth();
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationBasicInfoSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileBasicInfoFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      photo: undefined,
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe(formData);

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof EditProfileBasicInfoFormData>
      ).forEach((key) => {
        setError(key, {
          type: "manual",
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      setUser(data);

      enqueueSnackbar(t("profile:alerts.profile.success"), {
        variant: "success",
      });
    }
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName ?? "",
      lastName: user?.lastName ?? "",
      photo: user?.photo,
    });
  }, [user, reset]);

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form
          className="profile-page__form profile-page__form--basic"
          onSubmit={onSubmit}
        >
          <div className="mt-6 mb-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="text-xl font-semibold">{t("profile:title1")}</h2>
            </div>
            <div className="col-span-12">
              <FormAvatarInput<EditProfileBasicInfoFormData>
                name="photo"
                testId="photo"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileBasicInfoFormData>
                name="firstName"
                label={t("profile:inputs.firstName.label")}
                testId="first-name"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileBasicInfoFormData>
                name="lastName"
                label={t("profile:inputs.lastName.label")}
                testId="last-name"
              />
            </div>

            <div className="col-span-12">
              <BasicInfoFormActions />
              <span className="ms-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => reset()}
                  data-testid="cancel-edit-profile"
                >
                  {t("profile:actions.cancel")}
                </Button>
              </span>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangeEmail() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { enqueueSnackbar } = useSnackbar();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationChangeEmailSchema();
  const { user } = useAuth();

  const methods = useForm<EditProfileChangeEmailFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      email: "",
      emailConfirmation: "",
    },
  });

  const { handleSubmit, reset, setError } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      email: formData.email,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<keyof EditProfileChangeEmailFormData>
      ).forEach((key) => {
        setError(key, {
          type: "manual",
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      reset();

      enqueueSnackbar(t("profile:alerts.email.success"), {
        variant: "success",
        autoHideDuration: 15000,
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form
          className="profile-page__form profile-page__form--email"
          onSubmit={onSubmit}
        >
          <div className="mb-6 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="text-xl font-semibold">{t("profile:title2")}</h2>
            </div>
            <div className="col-span-12">
              <p>{user?.email}</p>
            </div>
            <div className="col-span-12">
              <FormTextInput<EditProfileChangeEmailFormData>
                name="email"
                label={t("profile:inputs.email.label")}
                type="email"
                testId="email"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileChangeEmailFormData>
                name="emailConfirmation"
                label={t("profile:inputs.emailConfirmation.label")}
                type="email"
                testId="email-confirmation"
              />
            </div>

            <div className="col-span-12">
              <ChangeEmailFormActions />
              <span className="ms-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => reset()}
                  data-testid="cancel-edit-email"
                >
                  {t("profile:actions.cancel")}
                </Button>
              </span>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangePassword() {
  const fetchAuthPatchMe = useAuthPatchMeService();
  const { t } = useTranslation("profile");
  const validationSchema = useValidationChangePasswordSchema();
  const { enqueueSnackbar } = useSnackbar();

  const methods = useForm<EditProfileChangePasswordFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      oldPassword: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  const { handleSubmit, setError, reset } = methods;

  const onSubmit = handleSubmit(async (formData) => {
    const { data, status } = await fetchAuthPatchMe({
      password: formData.password,
      oldPassword: formData.oldPassword,
    });

    if (status === HTTP_CODES_ENUM.UNPROCESSABLE_ENTITY) {
      (
        Object.keys(data.errors) as Array<
          keyof EditProfileChangePasswordFormData
        >
      ).forEach((key) => {
        setError(key, {
          type: "manual",
          message: t(
            `profile:inputs.${key}.validation.server.${data.errors[key]}`
          ),
        });
      });

      return;
    }

    if (status === HTTP_CODES_ENUM.OK) {
      reset();

      enqueueSnackbar(t("profile:alerts.password.success"), {
        variant: "success",
      });
    }
  });

  return (
    <FormProvider {...methods}>
      <div className="mx-auto w-full max-w-md px-4">
        <form
          className="profile-page__form profile-page__form--security"
          onSubmit={onSubmit}
        >
          <div className="mb-4 grid grid-cols-12 gap-4">
            <div className="col-span-12">
              <h2 className="text-xl font-semibold">{t("profile:title3")}</h2>
            </div>
            <div className="col-span-12">
              <FormTextInput<EditProfileChangePasswordFormData>
                name="oldPassword"
                label={t("profile:inputs.oldPassword.label")}
                type="password"
                testId="old-password"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileChangePasswordFormData>
                name="password"
                label={t("profile:inputs.password.label")}
                type="password"
                testId="new-password"
              />
            </div>

            <div className="col-span-12">
              <FormTextInput<EditProfileChangePasswordFormData>
                name="passwordConfirmation"
                label={t("profile:inputs.passwordConfirmation.label")}
                type="password"
                testId="password-confirmation"
              />
            </div>

            <div className="col-span-12">
              <ChangePasswordFormActions />
              <span className="ms-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => reset()}
                  data-testid="cancel-edit-password"
                >
                  {t("profile:actions.cancel")}
                </Button>
              </span>
            </div>
          </div>
        </form>
      </div>
    </FormProvider>
  );
}

function FormChangeEmailWrapper() {
  const { user } = useAuth();

  return user?.provider === UserProviderEnum.EMAIL ? <FormChangeEmail /> : null;
}

function FormChangePasswordWrapper() {
  const { user } = useAuth();

  return user?.provider === UserProviderEnum.EMAIL ? (
    <FormChangePassword />
  ) : null;
}

function EditProfile() {
  const { t } = useTranslation("profile");
  const { user } = useAuth();
  const fetchProfileTabs = useGetProfileTabsService();
  const [activeTabKey, setActiveTabKey] = useState("profile");
  const profileTabsQuery = useQuery({
    queryKey: profileTabsQueryKey,
    queryFn: async ({ signal }) => {
      const { status, data } = await fetchProfileTabs({ signal });
      if (status !== HTTP_CODES_ENUM.OK)
        throw new Error("profileTabsLoadFailed");
      return data;
    },
  });

  const tabs = useMemo(
    () =>
      (profileTabsQuery.data ?? []).filter(
        (tab) =>
          !["email", "security"].includes(tab.key) ||
          user?.provider === UserProviderEnum.EMAIL
      ),
    [profileTabsQuery.data, user?.provider]
  );
  const renderTabPanel = (tab: ProfileTab) => {
    if (tab.key === "profile") return <FormBasicInfo />;
    if (tab.key === "email") return <FormChangeEmailWrapper />;
    if (tab.key === "security") return <FormChangePasswordWrapper />;

    const Panel = getProfileTabPanel(tab.key);
    return Panel ? (
      <Panel />
    ) : (
      <p className="py-5 text-sm text-muted-foreground" role="status">
        {t("states.panelUnavailable")}
      </p>
    );
  };

  return (
    <div className="profile-page mx-auto w-full max-w-5xl px-4 py-8">
      <header className="profile-page__header mb-6">
        <h1 className="text-2xl font-semibold">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("description")}</p>
      </header>

      {profileTabsQuery.isPending ? (
        <div className="flex min-h-52 items-center justify-center text-muted-foreground">
          <Loader2
            className="size-5 animate-spin"
            aria-label={t("states.loading")}
          />
        </div>
      ) : profileTabsQuery.isError ? (
        <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-sm">
          <p role="alert">{t("states.loadFailed")}</p>
          <Button
            type="button"
            variant="outline"
            onClick={() => profileTabsQuery.refetch()}
          >
            {t("actions.retry")}
          </Button>
        </div>
      ) : (
        <TabsWorkspace
          tabs={tabs}
          value={activeTabKey}
          onValueChange={setActiveTabKey}
          navigationLabel={t("tabs.label")}
          classPrefix="profile-page"
          getLabel={(tab) => t(`tabs.${tab.key}`, { defaultValue: tab.label })}
          renderPanel={renderTabPanel}
        />
      )}
    </div>
  );
}

export default withPageRequiredAuth(EditProfile);
