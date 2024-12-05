import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as fs from 'fs';
import * as path from 'path';

const projectName = `llm-streamlit`; 
const region = process.env.CDK_DEFAULT_REGION;    
const accountId = process.env.CDK_DEFAULT_ACCOUNT;

export class CdkLlmStreamlitStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // const policy = new iam.PolicyDocument({
    //   statements: [
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         'ec2:*'
    //       ],
    //       resources: ['arn:aws:ec2:*:*:instance/*'],
    //     }),
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         'bedrock:*'
    //       ],
    //       resources: ['*'],
    //     }),
    //     new iam.PolicyStatement({
    //       effect: iam.Effect.ALLOW,
    //       actions: [
    //         'ssm:GetParameter',
    //         'ssm:GetParameters',
    //       ],
    //       resources: ['*'],
    //     }),
    //   ],
    // });

    const ec2Role = new iam.Role(this, `role-ec2-for-${projectName}`, {
      roleName: `role-ec2-for-${projectName}-${region}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal("ec2.amazonaws.com"),
        new iam.ServicePrincipal("bedrock.amazonaws.com"),
      )
    });
    // ec2Role.addManagedPolicy({
    //   managedPolicyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    // });

    const BedrockPolicy = new iam.PolicyStatement({  
      resources: ['*'],
      actions: ['bedrock:*'],
    });        
    ec2Role.attachInlinePolicy( // add bedrock policy
      new iam.Policy(this, `bedrock-policy-ec2-for-${projectName}`, {
        statements: [BedrockPolicy],
      }),
    );     

    const ec2Policy = new iam.PolicyStatement({  
      resources: ['arn:aws:ec2:*:*:instance/*'],
      actions: ['ec2:*'],
    });
    ec2Role.attachInlinePolicy( // add bedrock policy
      new iam.Policy(this, `ec2-policy-for-${projectName}`, {
        statements: [ec2Policy],
      }),
    );

    // vpc
    const vpc = new ec2.Vpc(this, `vpc-for-${projectName}`, {
      vpcName: `vpc-for-${projectName}`,
      maxAzs: 1,
      cidr: "10.64.0.0/24",
      // natGateways: 1,
      createInternetGateway: true,
      subnetConfiguration: [
        {
          name: `public-subnet-for-${projectName}`,
          subnetType: ec2.SubnetType.PUBLIC
        }, 
        {
          name: `private-subnet-for-${projectName}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED
        },
      ],
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, `ec2-sg-for-${projectName}`,
      {
        vpc: vpc,
        allowAllOutbound: true,
        description: "Security group for ec2",
        securityGroupName: `ec2-sg-for-${projectName}`,
      }
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'httpIpv4',
    );

    // set AMI
    const ec2Image = ec2.MachineImage.fromSsmParameter(
      '/aws/service/canonical/ubuntu/server/focal/stable/current/amd64/hvm/ebs-gp2/ami-id'
    );
    
    // set User Data
    // const userData = ec2.UserData.forLinux();
    // const userDataScript = fs.readFileSync(path.join(__dirname, 'userdata.sh'), 'utf8');
    // userData.addCommands(userDataScript);

    // EC2 instance
  /*  const appInstance = new ec2.Instance(this, `streamlit-for-${projectName}`, {
      instanceType: new ec2.InstanceType('t2.small'), // m5.large
      associatePublicIpAddress: true,
      // machineImage: ec2Image,
      machineImage: ec2Image,
      instanceName: `streamlit-for-${projectName}`,
      vpc: vpc,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      // userData: userData,
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(8, {
          deleteOnTermination: false,
          encrypted: true,
        }),
      }],
      detailedMonitoring: true,
      instanceInitiatedShutdownBehavior: ec2.InstanceInitiatedShutdownBehavior.STOP,
    }); */

    // new cdk.CfnOutput(this, `appUrl-for-${projectName}`, {
    //   value: `http://${appInstance.instancePublicIp}/`,
    //   description: 'appUrl',
    //   exportName: 'appUrl',
    // }); 
  }
}
